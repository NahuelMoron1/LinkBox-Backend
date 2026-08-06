import crypto from "crypto";
import { NextFunction, Request, Response } from "express";

/**
 * Las cookies de sesión usan sameSite:"none" (necesario porque el frontend
 * vive en otro dominio que la API) — eso desactiva la defensa CSRF por
 * default del browser. Este middleware la reemplaza con el patrón
 * double-submit: el login deja una cookie "csrf_token" legible por JS
 * (no httpOnly), y el cliente tiene que repetir ese mismo valor en el
 * header X-CSRF-Token. Un sitio malicioso puede hacer que el browser mande
 * la cookie sola, pero no puede leerla para copiarla al header.
 * Solo hace falta en rutas que mutan estado usando la cookie como auth —
 * no en telemetría (que se autentica con id+password en el body) ni en GETs.
 */
export const verifyCsrf = (req: Request, res: Response, next: NextFunction) => {
  const cookieToken = req.cookies?.csrf_token;
  const headerToken = req.headers["x-csrf-token"];

  if (
    !cookieToken ||
    typeof headerToken !== "string" ||
    cookieToken.length !== headerToken.length ||
    !crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken))
  ) {
    return res.status(403).json({ message: "Invalid or missing CSRF token", code: "CSRF_INVALID" });
  }

  next();
};

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
