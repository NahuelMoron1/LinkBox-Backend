import express from "express";
import { exec } from "child_process";
import { GITHUB_TOKEN, GITHUB_USERNAME } from "./models/config";

const router = express.Router();

router.post("/github-webhook", (req, res) => {
  // Opcional: validar el secret si lo pusiste en GitHub
  console.log("Webhook recibido de GitHub");

  // Configurar Git para usar credenciales antes de pull
  const gitCommand = `cd /home/paddock1game-api/htdocs/api.paddock1game.com/Paddock1-Backend-Public && 
    git config --local credential.helper '!f() { echo "username=${GITHUB_USERNAME}"; echo "password=${GITHUB_TOKEN}"; }; f' && 
    git pull origin main && 
    npm install --production && 
    pm2 restart mi-backend`;

  exec(gitCommand, (err, stdout, stderr) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error ejecutando deploy");
    }
    console.log(stdout);
    res.send("Deploy realizado correctamente");
  });
});

export default router;
