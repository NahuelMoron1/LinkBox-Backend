import { Router } from "express";
import { check, install } from "../controllers/Update";

const router = Router();
router.post("/check", check);
router.post("/install", install);
export default router;
