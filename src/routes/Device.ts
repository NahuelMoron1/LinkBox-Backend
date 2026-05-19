import { Router } from "express";
import {
  deleteSession,
  getDeviceSessions,
  getPlanInfo,
  getSessionData,
  getToken,
  loginDevice,
  logout,
  saveSession,
} from "../controllers/Device";
import { postTelemetry } from "../controllers/Telemetry";
import { validateSubscription } from "../middlewares/validateSubscription";

const router = Router();

// Auth
router.post("/login", loginDevice);
router.post("/logout", logout);
router.get("/token", getToken);

// Telemetry
router.post("/telemetry", validateSubscription, postTelemetry);

// Plan & Sessions
router.get("/:deviceId/sessions", validateSubscription, getDeviceSessions);
router.get("/sessions/:sessionId/data", validateSubscription, getSessionData);
router.post("/:deviceId/sessions/save", validateSubscription, saveSession);
router.delete("/sessions/:sessionId", validateSubscription, deleteSession);
router.get("/:deviceId/plan-info", validateSubscription, getPlanInfo);

export default router;
