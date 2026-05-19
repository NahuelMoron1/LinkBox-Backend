"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const connection_1 = __importDefault(require("../../db/connection"));
const Users = connection_1.default.define("users", {
    id: {
        type: sequelize_1.DataTypes.STRING,
        primaryKey: true,
        defaultValue: sequelize_1.DataTypes.UUIDV4, // Genera UUID automáticamente
    },
    fullName: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    password: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    phone: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    userID: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM("active", "inactive"),
        allowNull: false,
        defaultValue: "active",
    },
    profileImage: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
}, {
    timestamps: false,
    defaultScope: {
        attributes: { exclude: ["password", "userID", "email"] },
    },
    scopes: {
        withAll: {
            attributes: { include: ["password", "userID", "email"] },
        },
    },
});
exports.default = Users;
