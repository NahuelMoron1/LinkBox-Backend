import { Router } from "express";
import { postTelemetry } from "../controllers/Telemetry";

const router = Router();

router.post("/telemetry", postTelemetry);

export default router;
