import { Router } from "express";
import {
  completeRecordingSession,
  deleteSession,
  getCurrentRecordingSession,
  getDeviceSessions,
  getPlanInfo,
  getSessionData,
  getToken,
  loginDevice,
  logout,
  renameSession,
  saveSession,
} from "../controllers/Device";
import { postTelemetry } from "../controllers/Telemetry";
import { authenticateJWT } from "../middlewares/authenticateJWT";
import { validateSubscription } from "../middlewares/validateSubscription";
import { verifyCsrf } from "../middlewares/verifyCsrf";

const router = Router();

// Auth — sin middleware, manejan su propia validación
router.post("/login", loginDevice);
// logout no cambia datos sensibles (solo borra cookies), pero igual exigimos
// CSRF por consistencia — no cuesta nada y cierra la puerta a "logout forzado".
router.post("/logout", verifyCsrf, logout);
router.get("/token", getToken);

// Telemetría del hardware — el controller valida id + password del body
router.post("/telemetry", postTelemetry);

// Endpoints del browser — requieren JWT válido + suscripción activa.
// Las que mutan estado (POST/PATCH/DELETE) además exigen CSRF: las cookies
// son sameSite:"none" porque el frontend vive en otro dominio, así que el
// browser ya no nos protege solo con eso (ver middlewares/verifyCsrf.ts).
router.get("/:deviceId/sessions", authenticateJWT, validateSubscription, getDeviceSessions);
router.get("/:deviceId/recording-session", authenticateJWT, validateSubscription, getCurrentRecordingSession);
router.post("/:deviceId/recording-session/complete", authenticateJWT, verifyCsrf, validateSubscription, completeRecordingSession);
router.get("/sessions/:sessionId/data", authenticateJWT, validateSubscription, getSessionData);
router.post("/:deviceId/sessions/save", authenticateJWT, verifyCsrf, validateSubscription, saveSession);
router.patch("/sessions/:sessionId/rename", authenticateJWT, verifyCsrf, validateSubscription, renameSession);
router.delete("/sessions/:sessionId", authenticateJWT, verifyCsrf, validateSubscription, deleteSession);
router.get("/:deviceId/plan-info", authenticateJWT, validateSubscription, getPlanInfo);

export default router;
