import { Router } from "express";
import { getStatus, approve, reject } from "../controllers/Update";

const router = Router();
router.get("/status", getStatus);
router.post("/approve", approve);
router.post("/reject", reject);
export default router;
