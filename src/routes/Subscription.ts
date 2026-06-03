import { Router } from "express";
import {
  cancelSubscription,
  changePlan,
  createCheckoutSession,
  getSubscriptionInfo,
} from "../controllers/Subscription";
import { authenticateJWT } from "../middlewares/authenticateJWT";

const router = Router();

// Endpoints protegidos — requieren JWT
router.post("/create-checkout-session", authenticateJWT, createCheckoutSession);
router.post("/cancel", authenticateJWT, cancelSubscription);
router.post("/change-plan", authenticateJWT, changePlan);
router.get("/info", authenticateJWT, getSubscriptionInfo);

export default router;
