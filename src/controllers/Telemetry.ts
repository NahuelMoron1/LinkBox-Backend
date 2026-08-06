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
  sonda:      [0, 30],   // AFR: ~9–22 for gasoline; lambda: 0.5–2. 0–30 covers any sensor
  gear:       [0, 10],
};

// ~6s de catch-up a 50Hz por request — suficiente para vaciar rápido un
// buffer acumulado tras un corte de señal, sin dejar mandar lotes gigantes
// que se coman la conexión a MySQL de un saque (ver bulkCreate más abajo).
const MAX_TELEMETRY_BATCH = 300;

/**
 * Sanitises telemetry data in-place:
 * - Fields that are missing/null are kept as-is (null → stored as null).
 * - Fields whose numeric value falls outside TELEMETRY_RANGES are set to null
 *   so the rest of the payload is still processed (no hard rejection).
 * Returns false only if `data` is not a plain object at all.
 */
const validateTelemetryData = (data: any): { valid: boolean; error?: string } => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { valid: false, error: "data must be a plain object" };
  }

  for (const [field, [min, max]] of Object.entries(TELEMETRY_RANGES)) {
    const val = data[field];
    if (val === undefined || val === null) continue;
    const num = Number(val);
    if (isNaN(num) || num < min || num > max) {
      // Nullify the bad field instead of rejecting the whole payload
      console.warn(`[Telemetry] Out-of-range ${field}: ${val} (expected ${min}–${max}) — field set to null`);
      data[field] = null;
    }
  }

  return { valid: true };
};

/**
 * El timestamp real de la muestra lo pone el device (importa para no perder
 * la resolución de milésimas cuando llega en una ráfaga de catch-up tras un
 * corte — el momento de inserción en la fila del auto ya no coincide con el
 * momento en que se guarda en MySQL). Si no viene o es inválido, cae a "ahora"
 * — mismo comportamiento que tenía este endpoint antes de aceptar lotes.
 */
const parseSampleTimestamp = (raw: any): Date => {
  if (raw === undefined || raw === null) return new Date();
  const parsed = new Date(raw);
  if (isNaN(parsed.getTime())) return new Date();
  return parsed;
};

const getOrCreateRecordingSession = async (deviceId: string) => {
  // Look for an active recording session first.
  // Use findOrCreate to prevent race conditions when multiple packets
  // arrive simultaneously (common at 10 packets/second).
  const [session] = await TelemetrySession.findOrCreate({
    where: { device_id: deviceId, status: "recording" },
    defaults: {
      session_name: `Session - ${new Date().toLocaleString()}`,
      start_time: new Date(),
      status: "recording",
    } as any,
  });

  return session;
};

/**
 * POST /api/devices/telemetry
 * Recibe datos de telemetría del device. `data` puede ser un objeto (una
 * muestra, uso normal en vivo) o un array de objetos (lote de catch-up
 * tras un corte de señal — cada uno con su propio timestamp real).
 * Acción según plan:
 * - BASIC: Solo emitir en vivo (Socket.io)
 * - PRO: Emitir en vivo (sin guardar automático)
 * - ULTIMATE: Emitir en vivo + guardar automático (en lote, ver bulkCreate)
 */
export const postTelemetry = async (req: Request, res: Response) => {
  const { id, password, data } = req.body;
  const now = Date.now();

  if (typeof id !== "string" || typeof password !== "string") {
    return res.status(400).json({ message: "id and password are required" });
  }

  const samples: any[] = Array.isArray(data) ? data : [data];

  if (samples.length === 0) {
    return res.status(400).json({ message: "data must not be empty" });
  }
  if (samples.length > MAX_TELEMETRY_BATCH) {
    return res.status(400).json({
      message: `data batch too large (max ${MAX_TELEMETRY_BATCH} samples per request)`,
    });
  }

  for (const sample of samples) {
    const sampleValidation = validateTelemetryData(sample);
    if (!sampleValidation.valid) {
      return res.status(400).json({ message: sampleValidation.error });
    }
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
    // 💜 PLAN PRO: Emitir en vivo (sin guardar automático)
    if (plan === "basic" || plan === "pro") {
      for (const sample of samples) io.to(id).emit("liveTelemetry", sample);
      return res.status(200).json({ message: "Telemetry broadcasted", count: samples.length });
    }

    // 🔵 PLAN ULTIMATE: Emitir en vivo + Guardar automático
    if (plan === "ultimate") {
      // Obtener o crear sesión
      const session = await getOrCreateRecordingSession(deviceId);

      // Guardar en BD en un solo viaje — un INSERT por muestra no aguanta
      // 20-50Hz sostenido con varias Pis en simultáneo. ?? (no ||) porque
      // 0 es un valor real (ej. gear en punto muerto, oil_press en marcha
      // en vacío) y no se puede confundir con "no vino el dato".
      const rows = samples.map((sample) => ({
        session_id: session.getDataValue("id"),
        device_id: deviceId,
        rpm: sample.rpm ?? null,
        water_temp: sample.water_temp ?? null,
        oil_temp: sample.oil_temp ?? null,
        oil_press: sample.oil_press ?? null,
        fuel_press: sample.fuel_press ?? null,
        sonda: sample.sonda ?? null,
        gear: sample.gear ?? null,
        timestamp: parseSampleTimestamp(sample.timestamp),
      }));

      await TelemetryData.bulkCreate(rows as any);

      // Incrementar contador por la cantidad real de muestras del lote
      await session.increment("total_records", { by: samples.length } as any);

      // Emitir en vivo, en orden
      for (const sample of samples) io.to(id).emit("liveTelemetry", sample);

      return res.status(200).json({
        message: "Telemetry recorded and broadcasted",
        sessionId: session.getDataValue("id"),
        count: samples.length,
      });
    }

    return res.status(400).json({ message: "Invalid plan" });
  } catch (error) {
    console.error("[TELEMETRY ERROR]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
