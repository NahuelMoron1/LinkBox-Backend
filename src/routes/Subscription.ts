import { Router } from "express";
import {
  cancelSubscription,
  changePlan,
  createCheckoutSession,
  getSubscriptionInfo,
} from "../controllers/Subscription";
import { authenticateJWT } from "../middlewares/authenticateJWT";
import { verifyCsrf } from "../middlewares/verifyCsrf";

const router = Router();

// Endpoints protegidos — requieren JWT. Las que mutan (crean un cobro,
// cancelan o cambian el plan) además exigen CSRF — ver middlewares/verifyCsrf.ts.
router.post("/create-checkout-session", authenticateJWT, verifyCsrf, createCheckoutSession);
router.post("/cancel", authenticateJWT, verifyCsrf, cancelSubscription);
router.post("/change-plan", authenticateJWT, verifyCsrf, changePlan);
router.get("/info", authenticateJWT, getSubscriptionInfo);

export default router;
