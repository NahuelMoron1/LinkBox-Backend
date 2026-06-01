import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { SECRET_JWT_KEY } from "../models/config";

/**
 * Verifica el access_token de la cookie httpOnly.
 * Si es válido, expone req.jwtDeviceId y req.jwtPlan para los controllers.
 * Todos los endpoints del browser (sesiones, plan, recording) deben usar este middleware.
 * El endpoint de telemetría del hardware NO usa este middleware (usa id+password en el body).
 */
export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.cookies?.access_token;

  if (!token) {
    return res
      .status(401)
      .json({ message: "Authentication required", code: "AUTH_REQUIRED" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_JWT_KEY) as any;
    (req as any).jwtDeviceId = decoded.id;
    (req as any).jwtPlan = decoded.plan;
    next();
  } catch {
    return res
      .status(401)
      .json({ message: "Session expired, please log in again", code: "AUTH_EXPIRED" });
  }
};
