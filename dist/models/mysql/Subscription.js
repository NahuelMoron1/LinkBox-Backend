"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const connection_1 = __importDefault(require("../../db/connection"));
const Subscription = connection_1.default.define("Subscriptions", {
    id: {
        type: sequelize_1.DataTypes.UUID,
        primaryKey: true,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
    },
    device_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: "Devices",
            key: "id",
        },
    },
    plan: {
        type: sequelize_1.DataTypes.ENUM("basic", "pro", "ultimate"),
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM("active", "expired", "cancelled"),
        allowNull: false,
        defaultValue: "active",
    },
    start_date: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    end_date: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    payment_id: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
        comment: "ID de pago (para futura integración con Stripe)",
    },
    amount: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    notes: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
}, {
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ["device_id"] },
        { fields: ["plan"] },
        { fields: ["status"] },
        { fields: ["end_date"] },
        { fields: ["device_id", "end_date"] },
    ],
});
exports.default = Subscription;
