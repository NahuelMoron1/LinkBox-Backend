"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Device_1 = require("../controllers/Device");
const Telemetry_1 = require("../controllers/Telemetry");
const validateSubscription_1 = require("../middlewares/validateSubscription");
const router = (0, express_1.Router)();
// Auth
router.post("/login", Device_1.loginDevice);
router.post("/logout", Device_1.logout);
router.get("/token", Device_1.getToken);
// Telemetry
router.post("/telemetry", validateSubscription_1.validateSubscription, Telemetry_1.postTelemetry);
// Plan & Sessions
router.get("/:deviceId/sessions", validateSubscription_1.validateSubscription, Device_1.getDeviceSessions);
router.get("/sessions/:sessionId/data", validateSubscription_1.validateSubscription, Device_1.getSessionData);
router.post("/:deviceId/sessions/save", validateSubscription_1.validateSubscription, Device_1.saveSession);
router.delete("/sessions/:sessionId", validateSubscription_1.validateSubscription, Device_1.deleteSession);
router.get("/:deviceId/plan-info", validateSubscription_1.validateSubscription, Device_1.getPlanInfo);
exports.default = router;
