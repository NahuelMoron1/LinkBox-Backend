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
exports.postTelemetry = void 0;
const Device_1 = __importDefault(require("../models/mysql/Device"));
const TelemetryData_1 = __importDefault(require("../models/mysql/TelemetryData"));
const TelemetrySession_1 = __importDefault(require("../models/mysql/TelemetrySession"));
const deviceCache = {};
const CACHE_DURATION = 24 * 60 * 60 * 1000;
/**
 * Validar en cache (muy rápido)
 */
const validateFromCache = (cachedDevice, password) => {
    if (!cachedDevice)
        return { valid: false, error: "Not in cache" };
    if (cachedDevice.password !== password) {
        return { valid: false, error: "Invalid password" };
    }
    if (cachedDevice.status === "inactive") {
        return { valid: false, error: "Device is inactive" };
    }
    if (cachedDevice.subscription_status === "suspended") {
        return {
            valid: false,
            error: "Subscription suspended",
            code: "SUBSCRIPTION_SUSPENDED",
        };
    }
    if (cachedDevice.subscription_status === "expired") {
        return {
            valid: false,
            error: "Subscription expired",
            code: "SUBSCRIPTION_EXPIRED",
        };
    }
    return { valid: true };
};
/**
 * Obtener o crear sesión de grabación actual (Plan Ultimate)
 */
const getOrCreateRecordingSession = (deviceId) => __awaiter(void 0, void 0, void 0, function* () {
    let session = yield TelemetrySession_1.default.findOne({
        where: {
            device_id: deviceId,
            status: "recording",
        },
    });
    if (!session) {
        session = yield TelemetrySession_1.default.create({
            device_id: deviceId,
            session_name: `Session - ${new Date().toISOString()}`,
            start_time: new Date(),
            status: "recording",
        });
    }
    return session;
});
/**
 * POST /api/devices/telemetry
 * Recibe datos de telemetría del device
 * Acción según plan:
 * - BASIC: Solo emitir en vivo (Socket.io)
 * - PRO: Emitir en vivo + permitir guardar manual
 * - ULTIMATE: Emitir en vivo + guardar automático
 */
const postTelemetry = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, password, data } = req.body;
    const now = Date.now();
    try {
        let cachedDevice = deviceCache[id];
        // Si no está en cache o expiró
        if (!cachedDevice || now > cachedDevice.expiration) {
            const device = yield Device_1.default.scope("withAll").findOne({
                where: { id: id },
            });
            if (!device) {
                return res.status(404).json({ message: "Device not found" });
            }
            // Verificar suscripción expirada
            const subscriptionEndDate = device.getDataValue("subscription_end_date");
            if (subscriptionEndDate && new Date(subscriptionEndDate) < new Date()) {
                yield device.update({ subscription_status: "expired" });
                return res.status(403).json({
                    message: "Subscription expired",
                    code: "SUBSCRIPTION_EXPIRED",
                });
            }
            // Actualizar cache
            cachedDevice = {
                id: device.getDataValue("id"),
                status: device.getDataValue("status"),
                password: device.getDataValue("password"),
                plan: device.getDataValue("plan"),
                subscription_status: device.getDataValue("subscription_status"),
                expiration: now + CACHE_DURATION,
            };
            deviceCache[id] = cachedDevice;
            console.log(`[TELEMETRY] Cache updated for device: ${id} (Plan: ${cachedDevice.plan})`);
        }
        // Validar desde cache
        const validation = validateFromCache(cachedDevice, password);
        if (!validation.valid) {
            if (validation.code === "SUBSCRIPTION_SUSPENDED") {
                return res.status(403).json({
                    message: validation.error,
                    code: validation.code,
                });
            }
            if (validation.code === "SUBSCRIPTION_EXPIRED") {
                return res.status(403).json({
                    message: validation.error,
                    code: validation.code,
                });
            }
            return res.status(401).json({ message: validation.error });
        }
        const io = req.app.get("socketio");
        const plan = cachedDevice.plan;
        const deviceId = cachedDevice.id;
        // 🔴 PLAN BÁSICO: Solo emitir en vivo
        if (plan === "basic") {
            io.to(id).emit("liveTelemetry", data);
            return res.status(200).json({ message: "Telemetry broadcasted" });
        }
        // 💜 PLAN PRO: Emitir en vivo (sin guardar automático)
        if (plan === "pro") {
            io.to(id).emit("liveTelemetry", data);
            return res.status(200).json({ message: "Telemetry broadcasted" });
        }
        // 🔵 PLAN ULTIMATE: Emitir en vivo + Guardar automático
        if (plan === "ultimate") {
            // Obtener o crear sesión
            const session = yield getOrCreateRecordingSession(deviceId);
            // Guardar en BD
            yield TelemetryData_1.default.create({
                session_id: session.getDataValue("id"),
                device_id: deviceId,
                rpm: data.rpm || null,
                water_temp: data.water_temp || null,
                oil_temp: data.oil_temp || null,
                oil_press: data.oil_press || null,
                fuel_press: data.fuel_press || null,
                sonda: data.sonda || null,
                gear: data.gear || null,
                timestamp: new Date(data.timestamp || Date.now()),
            });
            // Incrementar contador
            yield session.increment("total_records");
            // Emitir en vivo
            io.to(id).emit("liveTelemetry", data);
            return res.status(200).json({
                message: "Telemetry recorded and broadcasted",
                sessionId: session.getDataValue("id"),
            });
        }
        return res.status(400).json({ message: "Invalid plan" });
    }
    catch (error) {
        console.error("[TELEMETRY ERROR]", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.postTelemetry = postTelemetry;
