"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const connection_1 = __importDefault(require("../../db/connection"));
const Device = connection_1.default.define("Devices", {
    id: {
        type: sequelize_1.DataTypes.STRING,
        primaryKey: true,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
    },
    device_key: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    client_name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM("active", "inactive"),
        allowNull: false,
        defaultValue: "active",
    },
    // ===== CAMPOS DE MEMBRESÍA =====
    plan: {
        type: sequelize_1.DataTypes.ENUM("basic", "pro", "ultimate"),
        allowNull: false,
        defaultValue: "basic",
        comment: "Plan de membresía del device",
    },
    subscription_status: {
        type: sequelize_1.DataTypes.ENUM("active", "suspended", "expired"),
        allowNull: false,
        defaultValue: "active",
        comment: "Estado actual de la suscripción",
    },
    subscription_end_date: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        comment: "Fecha de vencimiento de la suscripción",
    },
    sessions_saved_this_month: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
        comment: "Contador de sesiones guardadas este mes (Plan Pro)",
    },
    last_session_reset: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: sequelize_1.DataTypes.NOW,
        comment: "Última vez que se reseteo el contador",
    },
    created_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    updated_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
}, {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    defaultScope: {
        attributes: { exclude: ["password"] },
    },
    scopes: {
        withAll: {
            attributes: { include: ["password"] },
        },
    },
    indexes: [
        { fields: ["plan"] },
        { fields: ["subscription_status"] },
        { fields: ["subscription_end_date"] },
    ],
});
exports.default = Device;
