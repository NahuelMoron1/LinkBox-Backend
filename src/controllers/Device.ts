import bcrypt from "bcrypt";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { DOMAIN, SECRET_JWT_KEY } from "../models/config";
import { DeviceInfo } from "../models/Device";
import Device from "../models/mysql/Device";
import TelemetryData from "../models/mysql/TelemetryData";
import TelemetrySession from "../models/mysql/TelemetrySession";

/**
 * POST /api/devices/login
 * Login del device con key + password
 * Devuelve información del plan y suscripción
 */
export const loginDevice = async (req: Request, res: Response) => {
  const { key, password } = req.body;

  try {
    const device = await Device.scope("withAll").findOne({
      where: { device_key: key },
    });

    const storedHash = device?.getDataValue("password");
    const isValidPassword = storedHash
      ? await bcrypt.compare(password, storedHash)
      : false;

    if (!device || !isValidPassword) {
      return res.status(401).json({
        message: "Invalid credentials",
        code: "INVALID_CREDENTIALS",
      });
    }

    if (device.getDataValue("status") === "inactive") {
      return res.status(403).json({
        message: "Device is inactive",
        code: "DEVICE_INACTIVE",
      });
    }

    // Verificar suscripción expirada (solo si ya tuvo una suscripción activa)
    const subscriptionEndDate = device.getDataValue("subscription_end_date");
    let subscriptionStatus = device.getDataValue("subscription_status");

    if (
      subscriptionStatus !== "inactive" &&
      subscriptionEndDate &&
      new Date(subscriptionEndDate) < new Date()
    ) {
      subscriptionStatus = "expired";
      await device.update({ subscription_status: "expired" });
    }

    const cookieDevice = {
      id: device.getDataValue("id"),
      clientName: device.getDataValue("client_name"),
      plan: device.getDataValue("plan"),
      subscriptionStatus: subscriptionStatus,
      subscriptionEndDate: device.getDataValue("subscription_end_date"),
      sessionsSavedThisMonth: device.getDataValue("sessions_saved_this_month"),
    };

    createCookies(cookieDevice, res);

    return res.status(200).json({
      message: "Login successful",
      device: {
        id: device.getDataValue("id"),
        clientName: device.getDataValue("client_name"),
        plan: device.getDataValue("plan"),
        subscriptionStatus: subscriptionStatus,
        subscriptionEndDate: device.getDataValue("subscription_end_date"),
        sessionsSavedThisMonth: device.getDataValue(
          "sessions_saved_this_month",
        ),
      },
    });
  } catch (error) {
    console.error("[LOGIN ERROR]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

function createCookies(cookieDevice: any, res: Response) {
  const access_token = jwt.sign(
    {
      id: cookieDevice.id,
      clientName: cookieDevice.clientName,
      plan: cookieDevice.plan,
      subscriptionStatus: cookieDevice.subscriptionStatus,
      subscriptionEndDate: cookieDevice.subscriptionEndDate,
      sessionsSavedThisMonth: cookieDevice.sessionsSavedThisMonth,
    },
    SECRET_JWT_KEY,
    {
      expiresIn: "1h",
    },
  );

  const refresh_token = jwt.sign(
    {
      id: cookieDevice.id,
      clientName: cookieDevice.clientName,
      plan: cookieDevice.plan,
      subscriptionStatus: cookieDevice.subscriptionStatus,
      subscriptionEndDate: cookieDevice.subscriptionEndDate,
      sessionsSavedThisMonth: cookieDevice.sessionsSavedThisMonth,
    },
    SECRET_JWT_KEY,
    {
      expiresIn: "1d",
    },
  );

  res.cookie("access_token", access_token, {
    path: "/",
    httpOnly: true,
    secure: true, ///process.env.NODE_ENV == 'production',
    sameSite: "none",
    domain: DOMAIN,
    maxAge: 1000 * 60 * 60,
  });

  res.cookie("refresh_token", refresh_token, {
    path: "/",
    httpOnly: true,
    secure: true, ///process.env.NODE_ENV == 'production',
    sameSite: "none",
    domain: DOMAIN,
    maxAge: 1000 * 60 * 60 * 24,
  });
}

export const logout = async (_req: Request, res: Response) => {
  const cookieOptions = {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "none" as const,
    domain: DOMAIN,
    maxAge: 0,
  };

  res.clearCookie("access_token", cookieOptions);
  res.clearCookie("refresh_token", cookieOptions);
  return res.status(200).json({ message: "Logged out" });
};

export const getToken = (req: Request, res: Response) => {
  try {
    // Leer el access_token de las cookies httpOnly
    const token = req.cookies.access_token;

    if (!token) {
      return res.status(401).json({ message: "No session found" });
    }

    // Verificar y decodificar el JWT
    const data = jwt.verify(token, SECRET_JWT_KEY);
    if (typeof data === "object" && data !== null) {
      const deviceInfo: DeviceInfo = data as DeviceInfo;
      return res.json(deviceInfo);
    } else {
      return res.status(401).json({ message: "Invalid token" });
    }
  } catch (error) {
    console.error("[GET TOKEN ERROR]", error);
    return res.status(401).json({ message: "Session expired or invalid" });
  }
};

/**
 * GET /api/devices/:deviceId/sessions
 * Obtener todas las sesiones completadas de un device
 * Solo para Plan Pro y Ultimate
 */
export const getDeviceSessions = async (req: Request, res: Response) => {
  const { deviceId } = req.params;
  const authenticatedId = (req as any).jwtDeviceId;

  if (deviceId !== authenticatedId) {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const device = await Device.findByPk(deviceId);

    if (!device) {
      return res.status(404).json({ message: "Device not found" });
    }

    const plan = device.getDataValue("plan");

    // Solo Pro y Ultimate pueden ver sesiones guardadas
    if (plan === "basic") {
      return res.status(403).json({
        message: "This feature is not available in your plan",
        code: "PLAN_UPGRADE_REQUIRED",
      });
    }

    const sessions = await TelemetrySession.findAll({
      where: {
        device_id: deviceId,
        status: ["completed", "draft"],
      },
      order: [["created_at", "DESC"]],
      attributes: [
        "id",
        "session_name",
        "start_time",
        "end_time",
        "total_records",
        "status",
        "created_at",
      ],
    });

    return res.status(200).json({
      sessions: sessions,
      plan: plan,
    });
  } catch (error) {
    console.error("[GET SESSIONS ERROR]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * GET /api/devices/sessions/:sessionId/data
 * Obtener todos los datos de una sesión
 * Usado para visualizar histórico
 */
export const getSessionData = async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const authenticatedId = (req as any).jwtDeviceId;

  try {
    const session = await TelemetrySession.findByPk(sessionId);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.getDataValue("device_id") !== authenticatedId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const data = await TelemetryData.findAll({
      where: { session_id: sessionId },
      order: [["timestamp", "ASC"]],
      attributes: [
        "id",
        "rpm",
        "water_temp",
        "oil_temp",
        "oil_press",
        "fuel_press",
        "sonda",
        "gear",
        "timestamp",
      ],
    });

    return res.status(200).json({
      session: {
        id: session.getDataValue("id"),
        name: session.getDataValue("session_name"),
        startTime: session.getDataValue("start_time"),
        endTime: session.getDataValue("end_time"),
        totalRecords: session.getDataValue("total_records"),
      },
      data: data,
    });
  } catch (error) {
    console.error("[GET SESSION DATA ERROR]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * POST /api/devices/:deviceId/sessions/save
 * Guardar sesión manualmente (Plan Pro)
 * Limita a 2 sesiones por mes
 */
export const saveSession = async (req: Request, res: Response) => {
  const { deviceId } = req.params;
  const { sessionName } = req.body;
  const authenticatedId = (req as any).jwtDeviceId;

  if (deviceId !== authenticatedId) {
    return res.status(403).json({ message: "Access denied" });
  }

  if (
    sessionName !== undefined &&
    (typeof sessionName !== "string" || sessionName.trim().length === 0 || sessionName.length > 100)
  ) {
    return res.status(400).json({ message: "sessionName must be a non-empty string of max 100 characters" });
  }

  try {
    const device = await Device.findByPk(deviceId);

    if (!device) {
      return res.status(404).json({ message: "Device not found" });
    }

    const plan = device.getDataValue("plan");

    // Basic no puede guardar
    if (plan === "basic") {
      return res.status(403).json({
        message: "This feature is not available in your plan",
        code: "PLAN_UPGRADE_REQUIRED",
      });
    }

    // Validar límite para Pro
    if (plan === "pro") {
      const saved = device.getDataValue("sessions_saved_this_month");
      const lastReset = new Date(
        device.getDataValue("last_session_reset") || 0,
      );
      const currentMonth = new Date().getMonth();
      const lastResetMonth = lastReset.getMonth();

      // Si cambió el mes, resetear
      if (lastResetMonth !== currentMonth) {
        await device.update({
          sessions_saved_this_month: 0,
          last_session_reset: new Date(),
        });
      } else if (saved >= 2) {
        return res.status(403).json({
          message: "You have reached the monthly limit of saved sessions",
          code: "SESSIONS_LIMIT_REACHED",
          limit: 2,
          current: saved,
          resetDate: new Date(lastReset.getTime() + 30 * 24 * 60 * 60 * 1000),
        });
      }
    }

    // Obtener o crear sesión de grabación actual
    let session = await TelemetrySession.findOne({
      where: {
        device_id: deviceId,
        status: "recording",
      },
    });

    if (!session) {
      session = await TelemetrySession.create({
        device_id: deviceId,
        session_name: sessionName || `Session - ${new Date().toISOString()}`,
        start_time: new Date(),
        status: "draft",
      } as any);
    } else {
      // Actualizar sesión existente
      await session.update({
        session_name: sessionName,
        status: "completed",
        end_time: new Date(),
        saved_by_user: plan === "pro", // Marcar como guardado por usuario si es Pro
      });
    }

    // Incrementar contador si es Pro
    if (plan === "pro") {
      await device.increment("sessions_saved_this_month");
    }

    return res.status(200).json({
      message: "Session saved successfully",
      session: {
        id: session.getDataValue("id"),
        name: session.getDataValue("session_name"),
        totalRecords: session.getDataValue("total_records"),
      },
    });
  } catch (error) {
    console.error("[SAVE SESSION ERROR]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * DELETE /api/devices/sessions/:sessionId
 * Eliminar una sesión
 */
export const renameSession = async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const { name }      = req.body;
  const authenticatedId = (req as any).jwtDeviceId;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ message: 'Session name is required' });
  }

  try {
    const session = await TelemetrySession.findByPk(sessionId);
    if (!session)
      return res.status(404).json({ message: 'Session not found' });
    if (session.getDataValue('device_id') !== authenticatedId)
      return res.status(403).json({ message: 'Access denied' });

    await session.update({ session_name: name.trim() });
    return res.status(200).json({ message: 'Session renamed', name: name.trim() });
  } catch (error) {
    console.error('[RENAME SESSION ERROR]', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteSession = async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const authenticatedId = (req as any).jwtDeviceId;

  try {
    const session = await TelemetrySession.findByPk(sessionId);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.getDataValue("device_id") !== authenticatedId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const deviceId = session.getDataValue("device_id");
    const device = await Device.findByPk(deviceId);

    // Si fue guardado por usuario (Pro), decrementar contador
    if (session.getDataValue("saved_by_user")) {
      await device?.decrement("sessions_saved_this_month");
    }

    // Eliminar sesión (automáticamente elimina datos asociados por FK)
    await session.destroy();

    return res.status(200).json({
      message: "Session deleted successfully",
    });
  } catch (error) {
    console.error("[DELETE SESSION ERROR]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * GET /api/devices/:deviceId/plan-info
 * Obtener información sobre el plan actual
 */
export const getPlanInfo = async (req: Request, res: Response) => {
  const { deviceId } = req.params;
  const authenticatedId = (req as any).jwtDeviceId;

  if (deviceId !== authenticatedId) {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const device = await Device.findByPk(deviceId);

    if (!device) {
      return res.status(404).json({ message: "Device not found" });
    }

    const plan = device.getDataValue("plan");
    const sessionsSavedThisMonth = device.getDataValue(
      "sessions_saved_this_month",
    );

    let planInfo: any = {
      plan: plan,
      subscriptionStatus: device.getDataValue("subscription_status"),
      subscriptionEndDate: device.getDataValue("subscription_end_date"),
    };

    // Información según plan
    switch (plan) {
      case "basic":
        planInfo.features = {
          liveTelemetry: true,
          saveData: false,
          historicalData: false,
        };
        break;

      case "pro":
        planInfo.features = {
          liveTelemetry: true,
          saveData: true,
          historicalData: true,
          sessionsPerMonth: 2,
          sessionsSaved: sessionsSavedThisMonth,
          sessionsRemaining: Math.max(0, 2 - sessionsSavedThisMonth),
        };
        break;

      case "ultimate":
        planInfo.features = {
          liveTelemetry: true,
          saveData: true,
          historicalData: true,
          autoSave: true,
          unlimited: true,
        };
        break;
    }

    return res.status(200).json(planInfo);
  } catch (error) {
    console.error("[GET PLAN INFO ERROR]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * GET /api/devices/:deviceId/recording-session
 * Obtener la sesión en grabación actual con toda su telemetría
 * Solo para Plan Ultimate
 */
export const getCurrentRecordingSession = async (
  req: Request,
  res: Response,
) => {
  const { deviceId } = req.params;
  const authenticatedId = (req as any).jwtDeviceId;

  if (deviceId !== authenticatedId) {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const device = await Device.findByPk(deviceId);

    if (!device) {
      return res.status(404).json({ message: "Device not found" });
    }

    const plan = device.getDataValue("plan");

    // Solo Ultimate
    if (plan !== "ultimate") {
      return res.status(403).json({
        message: "This feature is only available for Ultimate plan",
        code: "PLAN_UPGRADE_REQUIRED",
      });
    }

    // Buscar sesión en recording
    const session = await TelemetrySession.findOne({
      where: {
        device_id: deviceId,
        status: "recording",
      },
    });

    if (!session) {
      // No hay sesión activa
      return res.status(200).json({
        session: null,
        data: [],
      });
    }

    // Obtener toda la telemetría de la sesión
    const data = await TelemetryData.findAll({
      where: { session_id: session.getDataValue("id") },
      order: [["timestamp", "ASC"]],
      attributes: [
        "id",
        "rpm",
        "water_temp",
        "oil_temp",
        "oil_press",
        "fuel_press",
        "sonda",
        "gear",
        "timestamp",
      ],
    });

    return res.status(200).json({
      session: {
        id: session.getDataValue("id"),
        name: session.getDataValue("session_name"),
        startTime: session.getDataValue("start_time"),
        endTime: session.getDataValue("end_time"),
        totalRecords: session.getDataValue("total_records"),
        status: session.getDataValue("status"),
      },
      data: data,
    });
  } catch (error) {
    console.error("[GET RECORDING SESSION ERROR]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * POST /api/devices/:deviceId/recording-session/complete
 * Completar la sesión en grabación (llamado cuando el cliente detecta inactividad)
 * Solo para Plan Ultimate
 */
export const completeRecordingSession = async (req: Request, res: Response) => {
  const { deviceId } = req.params;
  const authenticatedId = (req as any).jwtDeviceId;

  if (deviceId !== authenticatedId) {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const device = await Device.findByPk(deviceId);

    if (!device) {
      return res.status(404).json({ message: "Device not found" });
    }

    const plan = device.getDataValue("plan");

    if (plan !== "ultimate") {
      return res.status(403).json({
        message: "This feature is only available for Ultimate plan",
      });
    }

    // Encontrar y completar la sesión en recording
    const session = await TelemetrySession.findOne({
      where: {
        device_id: deviceId,
        status: "recording",
      },
    });

    if (!session) {
      return res.status(200).json({
        message: "No active recording session to complete",
      });
    }

    // Marcar como completed
    await session.update({
      status: "completed",
      end_time: new Date(),
    });

    return res.status(200).json({
      message: "Recording session completed",
      sessionId: session.getDataValue("id"),
    });
  } catch (error) {
    console.error("[COMPLETE RECORDING SESSION ERROR]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
