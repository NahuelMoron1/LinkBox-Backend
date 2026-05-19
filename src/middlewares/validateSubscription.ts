import { NextFunction, Request, Response } from "express";
import Device from "../models/mysql/Device";

/**
 * Middleware que valida el plan y suscripción del device
 * Debe ejecutarse DESPUÉS de autenticar el device
 */
export const validateSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { key } = req.query;

    if (!key) {
      return res.status(400).json({ message: "Device key is required" });
    }

    // Obtener device (sin password por defecto)
    const device = await Device.findOne({
      where: { id: key },
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

    // Verificar si el device está activo
    if (device.getDataValue("status") === "inactive") {
      return res.status(403).json({
        message: "Device is inactive",
        code: "DEVICE_INACTIVE",
      });
    }

    // Verificar si la suscripción está suspendida
    if (device.getDataValue("subscription_status") === "suspended") {
      return res.status(403).json({
        message: "Subscription has been suspended",
        code: "SUBSCRIPTION_SUSPENDED",
      });
    }

    // Verificar si la suscripción está expirada
    if (device.getDataValue("subscription_status") === "expired") {
      return res.status(403).json({
        message: "Subscription has expired",
        code: "SUBSCRIPTION_EXPIRED",
      });
    }

    // Verificar fecha de vencimiento
    const subscriptionEndDate = device.getDataValue("subscription_end_date");
    if (subscriptionEndDate && new Date(subscriptionEndDate) < new Date()) {
      // Actualizar estado a expirado
      await device.update({ subscription_status: "expired" });

      return res.status(403).json({
        message: "Subscription has expired",
        code: "SUBSCRIPTION_EXPIRED",
      });
    }

    // Attach device info al request
    (req as any).device = device;
    (req as any).plan = device.getDataValue("plan");

    next();
  } catch (error) {
    console.error("Error validating subscription:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Middleware que verifica si el device tiene acceso a una característica específica
 */
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
