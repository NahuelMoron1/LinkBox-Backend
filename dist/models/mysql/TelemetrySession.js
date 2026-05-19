"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const connection_1 = __importDefault(require("../../db/connection"));
const TelemetrySession = connection_1.default.define("TelemetrySessions", {
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
    session_name: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        comment: "Nombre de la sesión (ej: Ruta al trabajo)",
    },
    start_time: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    end_time: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    total_records: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM("recording", "completed", "draft"),
        allowNull: false,
        defaultValue: "recording",
    },
    saved_by_user: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
        comment: "True si el usuario manualmente guardó (Plan Pro)",
    },
}, {
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ["device_id"] },
        { fields: ["status"] },
        { fields: ["created_at"] },
        { fields: ["device_id", "status"] },
    ],
});
exports.default = TelemetrySession;
