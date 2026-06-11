import { Request, Response } from "express";

const TELEMETRY_RANGES: Record<string, [number, number]> = {
  rpm:        [0, 20000],
  water_temp: [-50, 200],
  oil_temp:   [-50, 200],
  oil_press:  [0, 200],
  fuel_press: [0, 100],
  sonda:      [0, 30],
  gear:       [0, 10],
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
      console.warn(`[Telemetry] Out-of-range ${field}: ${val} (expected ${min}–${max}) — field set to null`);
      data[field] = null;
    }
  }

  return { valid: true };
};

/**
 * POST /api/devices/telemetry
 * Recibe datos del script de lectura de hardware y los emite por Socket.io al dashboard.
 */
export const postTelemetry = (req: Request, res: Response) => {
  const { data } = req.body;

  const validation = validateTelemetryData(data);
  if (!validation.valid) {
    return res.status(400).json({ message: validation.error });
  }

  const io = req.app.get("socketio");
  io.emit("liveTelemetry", data);

  return res.status(200).json({ message: "ok" });
};
