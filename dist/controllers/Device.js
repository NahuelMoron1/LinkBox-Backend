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
exports.getPlanInfo = exports.deleteSession = exports.saveSession = exports.getSessionData = exports.getDeviceSessions = exports.getToken = exports.logout = exports.loginDevice = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../models/config");
const Device_1 = __importDefault(require("../models/mysql/Device"));
const TelemetryData_1 = __importDefault(require("../models/mysql/TelemetryData"));
const TelemetrySession_1 = __importDefault(require("../models/mysql/TelemetrySession"));
/**
 * POST /api/devices/login
 * Login del device con key + password
 * Devuelve información del plan y suscripción
 */
const loginDevice = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { key, password } = req.body;
    try {
        const device = yield Device_1.default.scope("withAll").findOne({
            where: { device_key: key },
        });
        if (!device || device.getDataValue("password") !== password) {
            return res.status(401).json({
                message: "Invalid credentials",
                code: "INVALID_CREDENTIALS",
            });
        }
        if (device.getDataValue("status") === "inactive") {
            return res.status(403).json({
                message: "Device is inactive",
                code: "DEVICE_INACTIVE",
            });
        }
        // Verificar suscripción expirada
        const subscriptionEndDate = device.getDataValue("subscription_end_date");
        let subscriptionStatus = device.getDataValue("subscription_status");
        if (subscriptionEndDate && new Date(subscriptionEndDate) < new Date()) {
            subscriptionStatus = "expired";
            yield device.update({ subscription_status: "expired" });
        }
        const cookieDevice = {
            id: device.getDataValue("id"),
            clientName: device.getDataValue("client_name"),
            plan: device.getDataValue("plan"),
            subscriptionStatus: subscriptionStatus,
            subscriptionEndDate: device.getDataValue("subscription_end_date"),
            sessionsSavedThisMonth: device.getDataValue("sessions_saved_this_month"),
        };
        createCookies(cookieDevice, res);
        return res.status(200).json({
            message: "Login successful",
            device: {
                id: device.getDataValue("id"),
                clientName: device.getDataValue("client_name"),
                plan: device.getDataValue("plan"),
                subscriptionStatus: subscriptionStatus,
                subscriptionEndDate: device.getDataValue("subscription_end_date"),
                sessionsSavedThisMonth: device.getDataValue("sessions_saved_this_month"),
            },
        });
    }
    catch (error) {
        console.error("[LOGIN ERROR]", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.loginDevice = loginDevice;
function createCookies(cookieDevice, res) {
    const access_token = jsonwebtoken_1.default.sign({
        id: cookieDevice.id,
        clientName: cookieDevice.clientName,
        plan: cookieDevice.plan,
        subscriptionStatus: cookieDevice.subscriptionStatus,
        subscriptionEndDate: cookieDevice.subscriptionEndDate,
        sessionsSavedThisMonth: cookieDevice.sessionsSavedThisMonth,
    }, config_1.SECRET_JWT_KEY, {
        expiresIn: "1h",
    });
    const refresh_token = jsonwebtoken_1.default.sign({
        id: cookieDevice.id,
        clientName: cookieDevice.clientName,
        plan: cookieDevice.plan,
        subscriptionStatus: cookieDevice.subscriptionStatus,
        subscriptionEndDate: cookieDevice.subscriptionEndDate,
        sessionsSavedThisMonth: cookieDevice.sessionsSavedThisMonth,
    }, config_1.SECRET_JWT_KEY, {
        expiresIn: "1d",
    });
    res.cookie("access_token", access_token, {
        path: "/",
        httpOnly: true,
        secure: true, ///process.env.NODE_ENV == 'production',
        sameSite: "none",
        domain: config_1.DOMAIN,
        maxAge: 1000 * 60 * 60,
    });
    res.cookie("refresh_token", refresh_token, {
        path: "/",
        httpOnly: true,
        secure: true, ///process.env.NODE_ENV == 'production',
        sameSite: "none",
        domain: config_1.DOMAIN,
        maxAge: 1000 * 60 * 60 * 24,
    });
}
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies.access_token;
        if (token) {
            res.cookie("refresh_token", "", {
                path: "/",
                httpOnly: true,
                secure: true, ///process.env.NODE_ENV == 'production',
                sameSite: "none",
                domain: config_1.DOMAIN,
                maxAge: 0,
            });
            res.cookie("access_token", "", {
                path: "/",
                httpOnly: true,
                secure: true, ///process.env.NODE_ENV == 'production',
                sameSite: "none",
                domain: config_1.DOMAIN,
                maxAge: 0,
            });
            return res.status(200).json({ message: "Logged out" });
        }
    }
    catch (error) {
        return res.status(500).json({ message: error });
    }
});
exports.logout = logout;
const getToken = (req, res) => {
    try {
        // Leer el access_token de las cookies httpOnly
        const token = req.cookies.access_token;
        if (!token) {
            return res.status(401).json({ message: "No session found" });
        }
        // Verificar y decodificar el JWT
        const data = jsonwebtoken_1.default.verify(token, config_1.SECRET_JWT_KEY);
        if (typeof data === "object" && data !== null) {
            const deviceInfo = data;
            return res.json(deviceInfo);
        }
        else {
            return res.status(401).json({ message: "Invalid token" });
        }
    }
    catch (error) {
        console.error("[GET TOKEN ERROR]", error);
        return res.status(401).json({ message: "Session expired or invalid" });
    }
};
exports.getToken = getToken;
/**
 * GET /api/devices/:deviceId/sessions
 * Obtener todas las sesiones completadas de un device
 * Solo para Plan Pro y Ultimate
 */
const getDeviceSessions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { deviceId } = req.params;
    try {
        const device = yield Device_1.default.findByPk(deviceId);
        if (!device) {
            return res.status(404).json({ message: "Device not found" });
        }
        const plan = device.getDataValue("plan");
        // Solo Pro y Ultimate pueden ver sesiones guardadas
        if (plan === "basic") {
            return res.status(403).json({
                message: "This feature is not available in your plan",
                code: "PLAN_UPGRADE_REQUIRED",
            });
        }
        const sessions = yield TelemetrySession_1.default.findAll({
            where: {
                device_id: deviceId,
                status: ["completed", "draft"],
            },
            order: [["created_at", "DESC"]],
            attributes: [
                "id",
                "session_name",
                "start_time",
                "end_time",
                "total_records",
                "status",
                "created_at",
            ],
        });
        return res.status(200).json({
            sessions: sessions,
            plan: plan,
        });
    }
    catch (error) {
        console.error("[GET SESSIONS ERROR]", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.getDeviceSessions = getDeviceSessions;
/**
 * GET /api/devices/sessions/:sessionId/data
 * Obtener todos los datos de una sesión
 * Usado para visualizar histórico
 */
const getSessionData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { sessionId } = req.params;
    try {
        const session = yield TelemetrySession_1.default.findByPk(sessionId);
        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }
        const data = yield TelemetryData_1.default.findAll({
            where: { session_id: sessionId },
            order: [["timestamp", "ASC"]],
            attributes: [
                "id",
                "rpm",
                "water_temp",
                "oil_temp",
                "oil_press",
                "fuel_press",
                "sonda",
                "gear",
                "timestamp",
            ],
        });
        return res.status(200).json({
            session: {
                id: session.getDataValue("id"),
                name: session.getDataValue("session_name"),
                startTime: session.getDataValue("start_time"),
                endTime: session.getDataValue("end_time"),
                totalRecords: session.getDataValue("total_records"),
            },
            data: data,
        });
    }
    catch (error) {
        console.error("[GET SESSION DATA ERROR]", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.getSessionData = getSessionData;
/**
 * POST /api/devices/:deviceId/sessions/save
 * Guardar sesión manualmente (Plan Pro)
 * Limita a 2 sesiones por mes
 */
const saveSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { deviceId } = req.params;
    const { sessionName } = req.body;
    try {
        const device = yield Device_1.default.findByPk(deviceId);
        if (!device) {
            return res.status(404).json({ message: "Device not found" });
        }
        const plan = device.getDataValue("plan");
        // Basic no puede guardar
        if (plan === "basic") {
            return res.status(403).json({
                message: "This feature is not available in your plan",
                code: "PLAN_UPGRADE_REQUIRED",
            });
        }
        // Validar límite para Pro
        if (plan === "pro") {
            const saved = device.getDataValue("sessions_saved_this_month");
            const lastReset = new Date(device.getDataValue("last_session_reset") || 0);
            const currentMonth = new Date().getMonth();
            const lastResetMonth = lastReset.getMonth();
            // Si cambió el mes, resetear
            if (lastResetMonth !== currentMonth) {
                yield device.update({
                    sessions_saved_this_month: 0,
                    last_session_reset: new Date(),
                });
            }
            else if (saved >= 2) {
                return res.status(403).json({
                    message: "You have reached the monthly limit of saved sessions",
                    code: "SESSIONS_LIMIT_REACHED",
                    limit: 2,
                    current: saved,
                    resetDate: new Date(lastReset.getTime() + 30 * 24 * 60 * 60 * 1000),
                });
            }
        }
        // Obtener o crear sesión de grabación actual
        let session = yield TelemetrySession_1.default.findOne({
            where: {
                device_id: deviceId,
                status: "recording",
            },
        });
        if (!session) {
            session = yield TelemetrySession_1.default.create({
                device_id: deviceId,
                session_name: sessionName || `Session - ${new Date().toISOString()}`,
                start_time: new Date(),
                status: "draft",
            });
        }
        else {
            // Actualizar sesión existente
            yield session.update({
                session_name: sessionName,
                status: "completed",
                end_time: new Date(),
                saved_by_user: plan === "pro", // Marcar como guardado por usuario si es Pro
            });
        }
        // Incrementar contador si es Pro
        if (plan === "pro") {
            yield device.increment("sessions_saved_this_month");
        }
        return res.status(200).json({
            message: "Session saved successfully",
            session: {
                id: session.getDataValue("id"),
                name: session.getDataValue("session_name"),
                totalRecords: session.getDataValue("total_records"),
            },
        });
    }
    catch (error) {
        console.error("[SAVE SESSION ERROR]", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.saveSession = saveSession;
/**
 * DELETE /api/devices/sessions/:sessionId
 * Eliminar una sesión
 */
const deleteSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { sessionId } = req.params;
    try {
        const session = yield TelemetrySession_1.default.findByPk(sessionId);
        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }
        const deviceId = session.getDataValue("device_id");
        const device = yield Device_1.default.findByPk(deviceId);
        // Si fue guardado por usuario (Pro), decrementar contador
        if (session.getDataValue("saved_by_user")) {
            yield (device === null || device === void 0 ? void 0 : device.decrement("sessions_saved_this_month"));
        }
        // Eliminar sesión (automáticamente elimina datos asociados por FK)
        yield session.destroy();
        return res.status(200).json({
            message: "Session deleted successfully",
        });
    }
    catch (error) {
        console.error("[DELETE SESSION ERROR]", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.deleteSession = deleteSession;
/**
 * GET /api/devices/:deviceId/plan-info
 * Obtener información sobre el plan actual
 */
const getPlanInfo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { deviceId } = req.params;
    try {
        const device = yield Device_1.default.findByPk(deviceId);
        if (!device) {
            return res.status(404).json({ message: "Device not found" });
        }
        const plan = device.getDataValue("plan");
        const sessionsSavedThisMonth = device.getDataValue("sessions_saved_this_month");
        let planInfo = {
            plan: plan,
            subscriptionStatus: device.getDataValue("subscription_status"),
            subscriptionEndDate: device.getDataValue("subscription_end_date"),
        };
        // Información según plan
        switch (plan) {
            case "basic":
                planInfo.features = {
                    liveTelemetry: true,
                    saveData: false,
                    historicalData: false,
                };
                break;
            case "pro":
                planInfo.features = {
                    liveTelemetry: true,
                    saveData: true,
                    historicalData: true,
                    sessionsPerMonth: 2,
                    sessionsSaved: sessionsSavedThisMonth,
                    sessionsRemaining: Math.max(0, 2 - sessionsSavedThisMonth),
                };
                break;
            case "ultimate":
                planInfo.features = {
                    liveTelemetry: true,
                    saveData: true,
                    historicalData: true,
                    autoSave: true,
                    unlimited: true,
                };
                break;
        }
        return res.status(200).json(planInfo);
    }
    catch (error) {
        console.error("[GET PLAN INFO ERROR]", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.getPlanInfo = getPlanInfo;
