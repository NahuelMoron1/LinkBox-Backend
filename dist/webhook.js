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
    // Opcional: validar el secret si lo pusiste en GitHub
    console.log("Webhook recibido de GitHub");
    // Configurar Git para usar credenciales antes de pull
    const gitCommand = `cd /home/paddock1game-api/htdocs/api.paddock1game.com/Paddock1-Backend-Public && 
    git config --local credential.helper '!f() { echo "username=${config_1.GITHUB_USERNAME}"; echo "password=${config_1.GITHUB_TOKEN}"; }; f' && 
    git pull origin main && 
    npm install --production && 
    pm2 restart mi-backend`;
    (0, child_process_1.exec)(gitCommand, (err, stdout, stderr) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error ejecutando deploy");
        }
        console.log(stdout);
        res.send("Deploy realizado correctamente");
    });
});
exports.default = router;
