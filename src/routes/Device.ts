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

const router = Router();

// Auth — sin middleware, manejan su propia validación
router.post("/login", loginDevice);
router.post("/logout", logout);
router.get("/token", getToken);

// Telemetría del hardware — el controller valida id + password del body
router.post("/telemetry", postTelemetry);

// Endpoints del browser — requieren JWT válido + suscripción activa
router.get("/:deviceId/sessions", authenticateJWT, validateSubscription, getDeviceSessions);
router.get("/:deviceId/recording-session", authenticateJWT, validateSubscription, getCurrentRecordingSession);
router.post("/:deviceId/recording-session/complete", authenticateJWT, validateSubscription, completeRecordingSession);
router.get("/sessions/:sessionId/data", authenticateJWT, validateSubscription, getSessionData);
router.post("/:deviceId/sessions/save", authenticateJWT, validateSubscription, saveSession);
router.patch("/sessions/:sessionId/rename", authenticateJWT, validateSubscription, renameSession);
router.delete("/sessions/:sessionId", authenticateJWT, validateSubscription, deleteSession);
router.get("/:deviceId/plan-info", authenticateJWT, validateSubscription, getPlanInfo);

export default router;
