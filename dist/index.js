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
const dotenv_1 = __importDefault(require("dotenv"));
const server_1 = __importDefault(require("./models/server"));
const { execSync } = require("child_process");
require("dotenv").config();
dotenv_1.default.config();
const server = new server_1.default();
const config_1 = require("./models/config");
function slackStatus() {
    (() => __awaiter(this, void 0, void 0, function* () {
        try {
            // Saco la lista en JSON
            const raw = execSync("pm2 jlist", { encoding: "utf8" });
            const apps = JSON.parse(raw);
            // Armo un mensaje limpio
            let message = "🚀 *Public Paddock1Game Server restarted*\n\n";
            apps.forEach((app) => {
                const name = app.name;
                const status = app.pm2_env.status;
                const uptime = Math.floor((Date.now() - app.pm2_env.pm_uptime) / 1000);
                const cpu = app.monit.cpu;
                const mem = (app.monit.memory / 1024 / 1024).toFixed(1) + " MB";
                let statusIcon = "⚪️";
                if (status === "online")
                    statusIcon = "🟢";
                else if (status === "errored" || status === "stopped")
                    statusIcon = "🔴";
                else if (status === "launching")
                    statusIcon = "🟡";
                message += `*App:* ${name}\n`;
                message += `• Status: ${statusIcon} ${status}\n`;
                message += `• Uptime: ${uptime}s\n`;
                message += `• CPU: ${cpu}%\n`;
                message += `• Memoria: ${mem}\n\n`;
            });
            // Envío a Slack
            yield fetch(config_1.SLACK_BACKEND_STATUS, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: message }),
            });
            console.log("Notificación enviada a Slack");
        }
        catch (error) {
            console.error("Error enviando a Slack:", error);
        }
    }))();
}
// Apenas arranca el backend
if (config_1.PRODUCTION) {
    slackStatus();
}
