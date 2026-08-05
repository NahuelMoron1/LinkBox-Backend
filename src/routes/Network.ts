import { Router } from "express";
import { getStatus, scan, connect } from "../controllers/Network";

const router = Router();
router.get("/status", getStatus);
router.get("/scan", scan);
router.post("/connect", connect);
export default router;
