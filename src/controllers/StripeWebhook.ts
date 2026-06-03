import { Request, Response } from "express";
import Stripe from "stripe";
import { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } from "../models/config";
import Device from "../models/mysql/Device";
import SubscriptionModel from "../models/mysql/Subscription";

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

const PLAN_AMOUNTS: Record<string, number> = {
  pro: 239.88,
  ultimate: 419.88,
};

/**
 * POST /api/webhooks/stripe
 * Recibe y procesa los eventos de Stripe.
 * Requiere body raw (sin parsear por express.json).
 */
export const stripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    return res.status(400).json({ message: "Missing stripe-signature header" });
  }

  let event: { type: string; data: { object: Record<string, any> } };

  try {
    event = getStripe().webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error("[STRIPE WEBHOOK] Signature verification failed:", err.message);
    return res.status(400).json({ message: `Webhook error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Record<string, any>);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Record<string, any>);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Record<string, any>);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Record<string, any>);
        break;

      default:
        break;
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("[STRIPE WEBHOOK] Handler error:", error);
    return res.status(500).json({ message: "Webhook handler failed" });
  }
};

// ─────────────────────────────────────────────
// Handlers
// ─────────────────────────────────────────────

async function handleCheckoutCompleted(session: Record<string, any>) {
  const { deviceId, plan } = session.metadata ?? {};
  if (!deviceId || !plan) {
    console.error("[WEBHOOK] checkout.session.completed: missing metadata", session.id);
    return;
  }

  const device = await Device.findByPk(deviceId);
  if (!device) {
    console.error("[WEBHOOK] checkout.session.completed: device not found", deviceId);
    return;
  }

  const stripeSubId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;

  const now = new Date();
  const endDate = new Date(now);
  endDate.setFullYear(endDate.getFullYear() + 1);

  await device.update({
    plan,
    subscription_status: "active",
    subscription_end_date: endDate,
    stripe_subscription_id: stripeSubId,
    cancel_at_period_end: false,
  });

  await SubscriptionModel.create({
    device_id: deviceId,
    plan,
    status: "active",
    start_date: now,
    end_date: endDate,
    payment_id: session.payment_intent ?? session.id,
    amount: PLAN_AMOUNTS[plan] ?? null,
    notes: `Stripe checkout session: ${session.id}`,
  } as any);

  console.log(`[WEBHOOK] Plan '${plan}' activated for device ${deviceId}`);
}

async function handleSubscriptionUpdated(sub: Record<string, any>) {
  const { deviceId, plan } = sub.metadata ?? {};
  if (!deviceId) return;

  const device = await Device.findByPk(deviceId);
  if (!device) return;

  const newPlan = plan ?? device.getDataValue("plan");
  const currentPeriodEnd = new Date(sub.current_period_end * 1000);

  await device.update({
    plan: newPlan,
    subscription_end_date: currentPeriodEnd,
    cancel_at_period_end: sub.cancel_at_period_end ?? false,
    subscription_status: sub.status === "active" ? "active" : "suspended",
  });

  console.log(
    `[WEBHOOK] Subscription updated for device ${deviceId}: plan=${newPlan}, cancelAtPeriodEnd=${sub.cancel_at_period_end}`
  );
}

async function handleSubscriptionDeleted(sub: Record<string, any>) {
  const { deviceId } = sub.metadata ?? {};
  if (!deviceId) return;

  const device = await Device.findByPk(deviceId);
  if (!device) return;

  await device.update({
    plan: "basic",
    subscription_status: "expired",
    subscription_end_date: null,
    stripe_subscription_id: null,
    cancel_at_period_end: false,
  });

  await SubscriptionModel.update(
    { status: "cancelled" },
    { where: { device_id: deviceId, status: "active" } }
  );

  console.log(`[WEBHOOK] Subscription cancelled for device ${deviceId}, reverted to basic`);
}

async function handlePaymentFailed(invoice: Record<string, any>) {
  const customerId =
    typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;

  if (!customerId) return;

  const device = await Device.findOne({
    where: { stripe_customer_id: customerId },
  });

  if (!device) return;

  await device.update({ subscription_status: "suspended" });

  console.log(`[WEBHOOK] Payment failed for customer ${customerId}, subscription suspended`);
}
