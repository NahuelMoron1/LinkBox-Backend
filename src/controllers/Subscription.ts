import { Request, Response } from "express";
import Stripe from "stripe";
import {
  FRONTEND_URL,
  STRIPE_PRICE_PRO,
  STRIPE_PRICE_ULTIMATE,
  STRIPE_SECRET_KEY,
} from "../models/config";
import Device from "../models/mysql/Device";
import SubscriptionModel from "../models/mysql/Subscription";

// Lazy init: Stripe se instancia solo cuando se hace la primera llamada,
// no en el arranque del servidor, para evitar crash si la key no está configurada.
type StripeInstance = InstanceType<typeof Stripe>;
let _stripe: StripeInstance | null = null;
function getStripe(): StripeInstance {
  if (!_stripe) {
    if (!STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not configured in environment variables");
    }
    _stripe = new Stripe(STRIPE_SECRET_KEY);
  }
  return _stripe;
}

const PRICE_IDS: Record<string, string> = {
  pro: STRIPE_PRICE_PRO,
  ultimate: STRIPE_PRICE_ULTIMATE,
};

const PLAN_AMOUNTS: Record<string, number> = {
  pro: 239.88,
  ultimate: 419.88,
};

/**
 * POST /api/subscriptions/create-checkout-session
 * Crea una sesión de Stripe Checkout para el plan seleccionado.
 * El device debe estar autenticado (JWT).
 */
export const createCheckoutSession = async (req: Request, res: Response) => {
  const deviceId = (req as any).jwtDeviceId;
  const { plan } = req.body;

  if (!plan || !["pro", "ultimate"].includes(plan)) {
    return res.status(400).json({
      message: "Plan must be 'pro' or 'ultimate'",
      code: "INVALID_PLAN",
    });
  }

  const priceId = PRICE_IDS[plan];
  if (!priceId) {
    return res.status(500).json({ message: "Stripe price not configured for this plan" });
  }

  try {
    const device = await Device.scope("withAll").findByPk(deviceId);
    if (!device) {
      return res.status(404).json({ message: "Device not found" });
    }

    const currentPlan = device.getDataValue("plan");

    // Si ya tiene este plan activo, no dejar comprar de nuevo
    if (currentPlan === plan && device.getDataValue("subscription_status") === "active") {
      return res.status(409).json({
        message: "You already have this plan active",
        code: "PLAN_ALREADY_ACTIVE",
      });
    }

    // Obtener o crear el Stripe Customer para este device
    let stripeCustomerId = device.getDataValue("stripe_customer_id");

    if (!stripeCustomerId) {
      const customer = await getStripe().customers.create({
        name: device.getDataValue("client_name"),
        metadata: { deviceId },
      });
      stripeCustomerId = customer.id;
      await device.update({ stripe_customer_id: stripeCustomerId });
    }

    const session = await getStripe().checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${FRONTEND_URL}/dashboard?subscription=success&plan=${plan}`,
      cancel_url: `${FRONTEND_URL}/pricing/${plan}?subscription=cancelled`,
      metadata: { deviceId, plan },
      subscription_data: {
        metadata: { deviceId, plan },
      },
      allow_promotion_codes: true,
    });

    return res.status(200).json({ checkoutUrl: session.url });
  } catch (error) {
    console.error("[CREATE CHECKOUT SESSION ERROR]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * POST /api/subscriptions/cancel
 * Cancela la suscripción al final del período vigente.
 * El device conserva acceso hasta subscription_end_date.
 */
export const cancelSubscription = async (req: Request, res: Response) => {
  const deviceId = (req as any).jwtDeviceId;

  try {
    const device = await Device.findByPk(deviceId);
    if (!device) return res.status(404).json({ message: "Device not found" });

    const stripeSubId = device.getDataValue("stripe_subscription_id");
    if (!stripeSubId) {
      return res.status(400).json({
        message: "No active Stripe subscription found",
        code: "NO_SUBSCRIPTION",
      });
    }

    if (device.getDataValue("cancel_at_period_end")) {
      return res.status(409).json({
        message: "Subscription is already scheduled for cancellation",
        code: "ALREADY_CANCELLING",
      });
    }

    await getStripe().subscriptions.update(stripeSubId, {
      cancel_at_period_end: true,
    });

    await device.update({ cancel_at_period_end: true });

    const endDate = device.getDataValue("subscription_end_date");

    return res.status(200).json({
      message: "Subscription will be cancelled at the end of the billing period",
      accessUntil: endDate,
    });
  } catch (error) {
    console.error("[CANCEL SUBSCRIPTION ERROR]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * POST /api/subscriptions/change-plan
 * Upgrades: inmediato con prorrateo (se cobra la diferencia).
 * Downgrades: se aplican al final del período actual (sin cobro inmediato).
 */
export const changePlan = async (req: Request, res: Response) => {
  const deviceId = (req as any).jwtDeviceId;
  const { newPlan } = req.body;

  if (!newPlan || !["pro", "ultimate"].includes(newPlan)) {
    return res.status(400).json({
      message: "newPlan must be 'pro' or 'ultimate'",
      code: "INVALID_PLAN",
    });
  }

  const priceId = PRICE_IDS[newPlan];
  if (!priceId) {
    return res.status(500).json({ message: "Stripe price not configured for this plan" });
  }

  try {
    const device = await Device.findByPk(deviceId);
    if (!device) return res.status(404).json({ message: "Device not found" });

    const currentPlan = device.getDataValue("plan");
    if (currentPlan === newPlan) {
      return res.status(409).json({
        message: "You already have this plan",
        code: "SAME_PLAN",
      });
    }

    const stripeSubId = device.getDataValue("stripe_subscription_id");
    if (!stripeSubId) {
      return res.status(400).json({
        message: "No active Stripe subscription found. Please subscribe first.",
        code: "NO_SUBSCRIPTION",
      });
    }

    const stripeSub = await getStripe().subscriptions.retrieve(stripeSubId);
    const currentItem = stripeSub.items.data[0];

    const isUpgrade =
      (currentPlan === "basic" || currentPlan === "pro") && newPlan === "ultimate" ||
      currentPlan === "basic" && newPlan === "pro";

    if (isUpgrade) {
      // Upgrade: aplicar inmediatamente con prorrateo
      await getStripe().subscriptions.update(stripeSubId, {
        items: [{ id: currentItem.id, price: priceId }],
        proration_behavior: "create_prorations",
        cancel_at_period_end: false,
      });

      // Webhook actualizará el plan en DB cuando Stripe confirme
      return res.status(200).json({
        message: `Upgrading to ${newPlan}. Prorated charge will appear on your next invoice.`,
        type: "upgrade",
        effective: "immediate",
      });
    } else {
      // Downgrade: aplicar al final del período
      await getStripe().subscriptions.update(stripeSubId, {
        items: [{ id: currentItem.id, price: priceId }],
        proration_behavior: "none",
        billing_cycle_anchor: "unchanged" as any,
      });

      const endDate = device.getDataValue("subscription_end_date");

      return res.status(200).json({
        message: `Downgrade to ${newPlan} scheduled for end of billing period.`,
        type: "downgrade",
        effective: endDate,
      });
    }
  } catch (error) {
    console.error("[CHANGE PLAN ERROR]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * GET /api/subscriptions/info
 * Devuelve el estado actual de la suscripción del device.
 */
export const getSubscriptionInfo = async (req: Request, res: Response) => {
  const deviceId = (req as any).jwtDeviceId;

  try {
    const device = await Device.findByPk(deviceId);
    if (!device) return res.status(404).json({ message: "Device not found" });

    const stripeSubId = device.getDataValue("stripe_subscription_id");
    let stripeData: any = null;

    if (stripeSubId) {
      try {
        const sub = await getStripe().subscriptions.retrieve(stripeSubId);
        stripeData = {
          status: sub.status,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          currentPeriodEnd: new Date((sub as any).current_period_end * 1000).toISOString(),
        };
      } catch {
        // La suscripción puede haber sido eliminada en Stripe
      }
    }

    const latestSub = await SubscriptionModel.findOne({
      where: { device_id: deviceId },
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({
      plan: device.getDataValue("plan"),
      subscriptionStatus: device.getDataValue("subscription_status"),
      subscriptionEndDate: device.getDataValue("subscription_end_date"),
      cancelAtPeriodEnd: device.getDataValue("cancel_at_period_end"),
      stripe: stripeData,
      lastPaymentId: latestSub?.getDataValue("payment_id") ?? null,
    });
  } catch (error) {
    console.error("[GET SUBSCRIPTION INFO ERROR]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
