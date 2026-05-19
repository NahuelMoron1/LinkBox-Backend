"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NODEMAILER_USER = exports.NODEMAILER = exports.ALLOWED_ORIGINS = exports.SSH_IP = exports.SSH_PASSWORD = exports.GITHUB_USERNAME = exports.GITHUB_TOKEN = exports.MAINTENANCE = exports.DB_PORT = exports.PRODUCTION = exports.URL = exports.SLACK_FRONTEND_STATUS = exports.SLACK_BACKEND_STATUS = exports.SLACK_UI_DEV_OPS_ERRORS = exports.DOMAIN = exports.SECRET_JWT_KEY = exports.DB_NAME = exports.DB_PASSWORD = exports.DB_USER = exports.DB_HOST = exports.PORT = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.PORT = process.env.PORT;
exports.DB_HOST = process.env.DB_HOST;
exports.DB_USER = process.env.DB_USER;
exports.DB_PASSWORD = process.env.DB_PASSWORD;
exports.DB_NAME = process.env.DB_NAME;
exports.SECRET_JWT_KEY = process.env.SECRET_JWT_KEY;
exports.DOMAIN = process.env.DOMAIN;
exports.SLACK_UI_DEV_OPS_ERRORS = process.env.SLACK_UI_DEV_OPS_ERRORS;
exports.SLACK_BACKEND_STATUS = process.env.SLACK_BACKEND_STATUS;
exports.SLACK_FRONTEND_STATUS = process.env.SLACK_FRONTEND_STATUS;
exports.URL = process.env.URL;
exports.PRODUCTION = process.env.PRODUCTION === "true";
exports.DB_PORT = parseInt(process.env.DB_PORT || "0");
exports.MAINTENANCE = process.env.MAINTENANCE === "true";
exports.GITHUB_TOKEN = process.env.GITHUB_TOKEN;
exports.GITHUB_USERNAME = process.env.GITHUB_USERNAME;
exports.SSH_PASSWORD = process.env.SSH_PASSWORD;
exports.SSH_IP = process.env.SSH_IP;
exports.ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
    : [];
exports.NODEMAILER = process.env.NODEMAILER;
exports.NODEMAILER_USER = process.env.NODEMAILER_USER;
