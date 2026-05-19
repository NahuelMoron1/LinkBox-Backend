"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePlan = exports.validateSubscription = void 0;
const Device_1 = __importDefault(require("../models/mysql/Device"));
/**
 * Middleware que valida el plan y suscripción del device
 * Debe ejecutarse DESPUÉS de autenticar el device
 */
const validateSubscription = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { key } = req.query;
        console.log("KEY: ", req.query.key);
        if (!key) {
            return res.status(400).json({ message: "Device key is required" });
        }
        // Obtener device (sin password por defecto)
        const device = yield Device_1.default.findOne({
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
            yield device.update({ subscription_status: "expired" });
            return res.status(403).json({
                message: "Subscription has expired",
                code: "SUBSCRIPTION_EXPIRED",
            });
        }
        // Attach device info al request
        req.device = device;
        req.plan = device.getDataValue("plan");
        next();
    }
    catch (error) {
        console.error("Error validating subscription:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.validateSubscription = validateSubscription;
/**
 * Middleware que verifica si el device tiene acceso a una característica específica
 */
const requirePlan = (allowedPlans) => {
    return (req, res, next) => {
        const plan = req.plan;
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
exports.requirePlan = requirePlan;
