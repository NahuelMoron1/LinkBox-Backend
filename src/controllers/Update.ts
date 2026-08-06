import { Request, Response } from "express";
import http from "http";
import { Server as SocketServer } from "socket.io";

// El contenedor no puede reemplazarse a sí mismo — el pull/healthcheck/swap
// real lo hace linkbox-deploy/updater/updater.py, corriendo en el host con
// acceso a /var/run/docker.sock. Este controller solo consulta su estado y
// re-emite el progreso por Socket.io, para no cambiar el contrato que ya
// usa UpdateService.ts en el frontend.
const UPDATER_URL = process.env.LINKBOX_UPDATER_URL || "http://host.docker.internal:4001";
const INTERNAL_TOKEN = process.env.LINKBOX_INTERNAL_TOKEN;
const POLL_INTERVAL_MS = 1000;
const REQUEST_TIMEOUT_MS = 5000;

interface UpdaterStatus {
  installedVersion: string | null;
  latestVersion: string | null;
  available: boolean;
  installing: boolean;
  progress: string | null;
  error: string | null;
}

function requestJson<T>(path: string, method: "GET" | "POST"): Promise<T> {
  return new Promise((resolve, reject) => {
    const headers = INTERNAL_TOKEN ? { "X-Internal-Token": INTERNAL_TOKEN } : undefined;
    const req = http.request(`${UPDATER_URL}${path}`, { method, timeout: REQUEST_TIMEOUT_MS, headers }, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(body || "{}") as T);
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on("error", reject);
    req.on("timeout", () => req.destroy(new Error("updater request timed out")));
    req.end();
  });
}

export async function check(_req: Request, res: Response): Promise<void> {
  try {
    const status = await requestJson<UpdaterStatus>("/status", "GET");
    res.json({ available: status.available, version: status.latestVersion });
  } catch {
    res.json({ available: false, version: null });
  }
}

let polling = false;

function pollProgress(io: SocketServer): void {
  if (polling) return;
  polling = true;

  let lastStep: string | null = null;
  const interval = setInterval(async () => {
    try {
      const status = await requestJson<UpdaterStatus>("/status", "GET");

      if (status.progress && status.progress !== lastStep) {
        lastStep = status.progress;
        io.emit("update:progress", { step: status.progress });
      }

      if (!status.installing && lastStep !== null) {
        clearInterval(interval);
        polling = false;
        io.emit("update:complete", { success: !status.error, error: status.error });
      }
    } catch {
      // el updater puede quedar momentáneamente inalcanzable durante el
      // swap del propio contenedor — se reintenta en el próximo tick.
    }
  }, POLL_INTERVAL_MS);
}

export async function install(req: Request, res: Response): Promise<void> {
  const io: SocketServer = req.app.get("socketio");

  try {
    const response = await requestJson<{ message: string }>("/install", "POST");
    res.json(response);
  } catch {
    res.status(502).json({ message: "No se pudo contactar al servicio de actualización" });
    return;
  }

  pollProgress(io);
}
