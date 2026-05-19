"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const connection_1 = __importDefault(require("../../db/connection"));
const TelemetryData = connection_1.default.define("TelemetryData", {
    id: {
        type: sequelize_1.DataTypes.UUID,
        primaryKey: true,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
    },
    session_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: "TelemetrySessions",
            key: "id",
        },
    },
    device_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: "Devices",
            key: "id",
        },
    },
    rpm: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    water_temp: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: true,
    },
    oil_temp: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: true,
    },
    oil_press: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: true,
    },
    fuel_press: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: true,
    },
    sonda: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: true,
    },
    gear: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
    timestamp: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
        comment: "Timestamp del dato (del device)",
    },
}, {
    timestamps: true,
    underscored: true,
    createdAt: "created_at",
    updatedAt: false,
    indexes: [
        { fields: ["session_id"] },
        { fields: ["device_id"] },
        { fields: ["timestamp"] },
        { fields: ["session_id", "timestamp"] },
        { fields: ["device_id", "timestamp"] },
    ],
});
exports.default = TelemetryData;
