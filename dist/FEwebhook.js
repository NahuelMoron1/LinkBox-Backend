"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const child_process_1 = require("child_process");
const config_1 = require("./models/config");
const router = express_1.default.Router();
router.post("/github-webhook", (req, res) => {
    var _a, _b, _c;
    // Opcional: validar el secret si lo pusiste en GitHub
    console.log("FE Webhook recibido de GitHub");
    const data = typeof req.body.payload === 'string'
        ? JSON.parse(req.body.payload)
        : req.body;
    const commitMessage = ((_a = data.head_commit) === null || _a === void 0 ? void 0 : _a.message) || "No commit message";
    const committerName = ((_c = (_b = data.head_commit) === null || _b === void 0 ? void 0 : _b.author) === null || _c === void 0 ? void 0 : _c.name) || "Unknown";
    const successPayload = {
        blocks: [
            {
                type: "header",
                text: {
                    type: "plain_text",
                    text: "🚀 Deployment Successful For Paddock1Game Public Frontend Site",
                    emoji: true
                }
            },
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: "*Project:* `Paddock1Game - Frontend`"
                }
            },
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `*Latest Commit:*\n> ${commitMessage}`
                }
            },
            {
                type: "context",
                elements: [
                    {
                        type: "mrkdwn",
                        text: `👤 *Author:* ${committerName}  |  📅 *Status:* Finished`
                    }
                ]
            }
        ]
    };
    const errorPayload = {
        blocks: [
            {
                type: "header",
                text: {
                    type: "plain_text",
                    text: "❌ Deployment Failed For Paddock1Game Public Frontend Site",
                    emoji: true
                }
            },
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: "*Attention:* The build process for `Paddock1Game` has failed."
                }
            },
            {
                type: "section",
                fields: [
                    {
                        type: "mrkdwn",
                        text: `*Commit:*\n${commitMessage}`
                    },
                    {
                        type: "mrkdwn",
                        text: `*Reason:*\nCheck server logs for details.`
                    }
                ]
            }
        ]
    };
    // Comando para acceder al sitio estático desde el servidor backend
    // Usamos un script con expect para manejar la autenticación SSH
    const gitCommand = `./src/fe_deploy.sh paddock1game ${config_1.SSH_IP} "${config_1.SSH_PASSWORD}" ${config_1.GITHUB_USERNAME} ${config_1.GITHUB_TOKEN}`;
    // Agregamos timeout para evitar que el proceso se cuelgue
    const child = (0, child_process_1.exec)(gitCommand, { timeout: 60000 }, (err, stdout, stderr) => {
        if (stderr)
            console.log("STDERR:", stderr);
        if (err) {
            fetch(config_1.SLACK_FRONTEND_STATUS, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(errorPayload),
            });
            console.error("Error ejecutando FE deploy:", err);
            return res.status(500).send("Error ejecutando FE deploy: " + err.message);
        }
        if (stdout.includes("FE Deploy realizado correctamente")) {
            console.log("BEFORE SLACK");
            fetch(config_1.SLACK_FRONTEND_STATUS, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(successPayload),
            });
            console.log("FE Deploy realizado correctamente");
            res.send("FE Deploy realizado correctamente");
        }
        else {
            fetch(config_1.SLACK_FRONTEND_STATUS, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(errorPayload),
            });
            console.error("Deploy no completado correctamente:", stdout);
            res.status(500).send("Deploy no completado correctamente");
        }
    });
    // Manejo adicional de timeout
    child.on("exit", (code, signal) => {
        if (signal === "SIGTERM") {
            res.status(500).send("Timeout en FE deploy");
        }
    });
});
exports.default = router;
