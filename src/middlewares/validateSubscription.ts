import { NextFunction, Request, Response } from "express";
import Device from "../models/mysql/Device";

/**
 * Verifica el estado de suscripción del device autenticado.
 * Debe ejecutarse DESPUÉS de authenticateJWT, que ya verificó el JWT
 * y puso el deviceId real en req.jwtDeviceId.
 */
export const validateSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const deviceId = (req as any).jwtDeviceId;

    if (!deviceId) {
      return res
        .status(401)
        .json({ message: "Authentication required", code: "AUTH_REQUIRED" });
    }

    const device = await Device.findOne({
      where: { id: deviceId },
      attributes: [
        "id",
        "device_key",
        "plan",
        "subscription_status",
        "subscription_end_date",
        "status",
      ],
    });

    if (!device) {
      return res.status(404).json({ message: "Device not found" });
    }

    if (device.getDataValue("status") === "inactive") {
      return res.status(403).json({
        message: "Device is inactive",
        code: "DEVICE_INACTIVE",
      });
    }

    if (device.getDataValue("subscription_status") === "suspended") {
      return res.status(403).json({
        message: "Subscription has been suspended",
        code: "SUBSCRIPTION_SUSPENDED",
      });
    }

    if (device.getDataValue("subscription_status") === "expired") {
      return res.status(403).json({
        message: "Subscription has expired",
        code: "SUBSCRIPTION_EXPIRED",
      });
    }

    const subscriptionEndDate = device.getDataValue("subscription_end_date");
    if (subscriptionEndDate && new Date(subscriptionEndDate) < new Date()) {
      await device.update({ subscription_status: "expired" });
      return res.status(403).json({
        message: "Subscription has expired",
        code: "SUBSCRIPTION_EXPIRED",
      });
    }

    (req as any).device = device;
    (req as any).plan = device.getDataValue("plan");

    next();
  } catch (error) {
    console.error("Error validating subscription:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const requirePlan = (allowedPlans: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const plan = (req as any).plan;

    if (!plan) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!allowedPlans.includes(plan)) {
      return res.status(403).json({
        message: "This feature is not available in your plan",
        code: "PLAN_UPGRADE_REQUIRED",
        requiredPlan: allowedPlans[0],
        currentPlan: plan,
      });
    }

    next();
  };
};
