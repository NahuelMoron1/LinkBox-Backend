import express from "express";
import { exec } from "child_process";
import {
  GITHUB_TOKEN,
  GITHUB_USERNAME,
  SLACK_FRONTEND_STATUS,
  SSH_IP,
  SSH_PASSWORD,
} from "./models/config";

const router = express.Router();

router.post("/github-webhook", (req, res) => {
  // Opcional: validar el secret si lo pusiste en GitHub
  console.log("FE Webhook recibido de GitHub");

  const data = typeof req.body.payload === 'string' 
  ? JSON.parse(req.body.payload) 
  : req.body;

  const commitMessage = data.head_commit?.message || "No commit message";
  const committerName = data.head_commit?.author?.name || "Unknown";

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
  const gitCommand = `./src/fe_deploy.sh paddock1game ${SSH_IP} "${SSH_PASSWORD}" ${GITHUB_USERNAME} ${GITHUB_TOKEN}`;

  // Agregamos timeout para evitar que el proceso se cuelgue
  const child = exec(gitCommand, { timeout: 60000 }, (err, stdout, stderr) => {
    if (stderr) console.log("STDERR:", stderr);

    if (err) {
      fetch(SLACK_FRONTEND_STATUS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(errorPayload),
      });
      console.error("Error ejecutando FE deploy:", err);
      return res.status(500).send("Error ejecutando FE deploy: " + err.message);
    }

    if (stdout.includes("FE Deploy realizado correctamente")) {
      console.log("BEFORE SLACK");
      fetch(SLACK_FRONTEND_STATUS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(successPayload),
      });
      console.log("FE Deploy realizado correctamente");
      res.send("FE Deploy realizado correctamente");
    } else {
      fetch(SLACK_FRONTEND_STATUS, {
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

export default router;
