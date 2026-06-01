import bcrypt from "bcrypt";
import { Request, Response } from "express";
import Device from "../models/mysql/Device";
import TelemetryData from "../models/mysql/TelemetryData";
import TelemetrySession from "../models/mysql/TelemetrySession";

interface CacheEntry {
  id: string;
  status: string;
  password: string;
  plan: string;
  subscription_status: string;
  expiration: number;
  authValidUntil: number;
}

const deviceCache: Record<string, CacheEntry> = {};
const CACHE_DURATION = 24 * 60 * 60 * 1000;
const AUTH_CACHE_DURATION = 30 * 1000;

const validateFromCache = async (
  cachedDevice: CacheEntry | undefined,
  password: string,
) => {
  if (!cachedDevice) return { valid: false, error: "Not in cache" };

  if (cachedDevice.status === "inactive") {
    return { valid: false, error: "Device is inactive" };
  }

  if (cachedDevice.subscription_status === "suspended") {
    return {
      valid: false,
      error: "Subscription suspended",
      code: "SUBSCRIPTION_SUSPENDED",
    };
  }

  if (cachedDevice.subscription_status === "expired") {
    return {
      valid: false,
      error: "Subscription expired",
      code: "SUBSCRIPTION_EXPIRED",
    };
  }

  // Si la validación de contraseña ya está cacheada, saltear bcrypt
  if (Date.now() < cachedDevice.authValidUntil) {
    return { valid: true };
  }

  const isValidPassword = await bcrypt.compare(password, cachedDevice.password);
  if (!isValidPassword) {
    return { valid: false, error: "Invalid password" };
  }

  cachedDevice.authValidUntil = Date.now() + AUTH_CACHE_DURATION;
  return { valid: true };
};

/**
 * Obtener o crear sesión de grabación actual (Plan Ultimate)
 */
const TELEMETRY_RANGES: Record<string, [number, number]> = {
  rpm:        [0, 20000],
  water_temp: [-50, 200],
  oil_temp:   [-50, 200],
  oil_press:  [0, 200],
  fuel_press: [0, 100],
  sonda:      [0, 5],
  gear:       [0, 8],
};

const validateTelemetryData = (data: any): { valid: boolean; error?: string } => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { valid: false, error: "data must be a plain object" };
  }

  for (const [field, [min, max]] of Object.entries(TELEMETRY_RANGES)) {
    const val = data[field];
    if (val === undefined || val === null) continue;
    const num = Number(val);
    if (isNaN(num) || num < min || num > max) {
      return { valid: false, error: `Invalid ${field}: ${val} (expected ${min}–${max})` };
    }
  }

  return { valid: true };
};

const getOrCreateRecordingSession = async (deviceId: string) => {
  let session = await TelemetrySession.findOne({
    where: {
      device_id: deviceId,
      status: "recording",
    },
  });

  if (!session) {
    session = await TelemetrySession.create({
      device_id: deviceId,
      session_name: `Session - ${new Date().toISOString()}`,
      start_time: new Date(),
      status: "recording",
    } as any);
  }

  return session;
};

/**
 * POST /api/devices/telemetry
 * Recibe datos de telemetría del device
 * Acción según plan:
 * - BASIC: Solo emitir en vivo (Socket.io)
 * - PRO: Emitir en vivo + permitir guardar manual
 * - ULTIMATE: Emitir en vivo + guardar automático
 */
export const postTelemetry = async (req: Request, res: Response) => {
  const { id, password, data } = req.body;
  const now = Date.now();

  const dataValidation = validateTelemetryData(data);
  if (!dataValidation.valid) {
    return res.status(400).json({ message: dataValidation.error });
  }

  try {
    let cachedDevice = deviceCache[id];

    // Si no está en cache o expiró
    if (!cachedDevice || now > cachedDevice.expiration) {
      const device = await Device.scope("withAll").findOne({
        where: { id: id },
      });

      if (!device) {
        return res.status(404).json({ message: "Device not found" });
      }

      // Verificar suscripción expirada
      const subscriptionEndDate = device.getDataValue("subscription_end_date");
      if (subscriptionEndDate && new Date(subscriptionEndDate) < new Date()) {
        await device.update({ subscription_status: "expired" });

        return res.status(403).json({
          message: "Subscription expired",
          code: "SUBSCRIPTION_EXPIRED",
        });
      }

      // Actualizar cache
      cachedDevice = {
        id: device.getDataValue("id"),
        status: device.getDataValue("status"),
        password: device.getDataValue("password"),
        plan: device.getDataValue("plan"),
        subscription_status: device.getDataValue("subscription_status"),
        expiration: now + CACHE_DURATION,
        authValidUntil: 0,
      };
      deviceCache[id] = cachedDevice;
    }

    // Validar desde cache
    const validation = await validateFromCache(cachedDevice, password);
    if (!validation.valid) {
      if (validation.code === "SUBSCRIPTION_SUSPENDED") {
        return res.status(403).json({
          message: validation.error,
          code: validation.code,
        });
      }
      if (validation.code === "SUBSCRIPTION_EXPIRED") {
        return res.status(403).json({
          message: validation.error,
          code: validation.code,
        });
      }
      return res.status(401).json({ message: validation.error });
    }

    const io = req.app.get("socketio");
    const plan = cachedDevice.plan;
    const deviceId = cachedDevice.id;

    // 🔴 PLAN BÁSICO: Solo emitir en vivo
    if (plan === "basic") {
      io.to(id).emit("liveTelemetry", data);
      return res.status(200).json({ message: "Telemetry broadcasted" });
    }

    // 💜 PLAN PRO: Emitir en vivo (sin guardar automático)
    if (plan === "pro") {
      io.to(id).emit("liveTelemetry", data);
      return res.status(200).json({ message: "Telemetry broadcasted" });
    }

    // 🔵 PLAN ULTIMATE: Emitir en vivo + Guardar automático
    if (plan === "ultimate") {
      // Obtener o crear sesión
      const session = await getOrCreateRecordingSession(deviceId);

      // Guardar en BD
      await TelemetryData.create({
        session_id: session.getDataValue("id"),
        device_id: deviceId,
        rpm: data.rpm || null,
        water_temp: data.water_temp || null,
        oil_temp: data.oil_temp || null,
        oil_press: data.oil_press || null,
        fuel_press: data.fuel_press || null,
        sonda: data.sonda || null,
        gear: data.gear || null,
        timestamp: new Date(),
      } as any);

      // Incrementar contador
      await session.increment("total_records");

      // Emitir en vivo
      io.to(id).emit("liveTelemetry", data);

      return res.status(200).json({
        message: "Telemetry recorded and broadcasted",
        sessionId: session.getDataValue("id"),
      });
    }

    return res.status(400).json({ message: "Invalid plan" });
  } catch (error) {
    console.error("[TELEMETRY ERROR]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
