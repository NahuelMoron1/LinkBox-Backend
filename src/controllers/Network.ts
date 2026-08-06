import { Request, Response } from "express";
import http from "http";

// El contenedor no tiene acceso al NetworkManager del host — nmcli lo
// ejecuta linkbox-deploy/network/network_helper.py, corriendo en el host
// como systemd service. Este controller es un proxy delgado, igual que
// Update.ts. Ver PLAN_LinkBox_Dashboard_Only.md sección 2.
const NETWORK_HELPER_URL =
  process.env.LINKBOX_NETWORK_HELPER_URL || "http://host.docker.internal:4002";
const INTERNAL_TOKEN = process.env.LINKBOX_INTERNAL_TOKEN;
const REQUEST_TIMEOUT_MS = 15000;

//test

function requestJson<T>(
  path: string,
  method: "GET" | "POST",
  body?: unknown,
): Promise<{ status: number; data: T }> {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined;
    const headers: Record<string, string | number> = {};
    if (payload) {
      headers["Content-Type"] = "application/json";
      headers["Content-Length"] = Buffer.byteLength(payload);
    }
    if (INTERNAL_TOKEN) headers["X-Internal-Token"] = INTERNAL_TOKEN;
    const req = http.request(
      `${NETWORK_HELPER_URL}${path}`,
      {
        method,
        timeout: REQUEST_TIMEOUT_MS,
        headers: Object.keys(headers).length ? headers : undefined,
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          try {
            resolve({
              status: res.statusCode ?? 500,
              data: JSON.parse(raw || "{}") as T,
            });
          } catch (err) {
            reject(err);
          }
        });
      },
    );
    req.on("error", reject);
    req.on("timeout", () =>
      req.destroy(new Error("network helper request timed out")),
    );
    if (payload) req.write(payload);
    req.end();
  });
}

export async function getStatus(_req: Request, res: Response): Promise<void> {
  try {
    const { data } = await requestJson("/status", "GET");
    res.json(data);
  } catch {
    res.json({ connected: false, ssid: null });
  }
}

export async function scan(_req: Request, res: Response): Promise<void> {
  try {
    const { data } = await requestJson<{ error?: string }>("/scan", "GET");
    if (data.error) {
      res.status(500).json({ message: data.error });
      return;
    }
    res.json(data);
  } catch {
    res.status(500).json({ message: "No se pudo escanear redes" });
  }
}

export async function connect(req: Request, res: Response): Promise<void> {
  const { ssid, password } = req.body;
  if (!ssid || typeof ssid !== "string") {
    res.status(400).json({ message: "SSID requerido" });
    return;
  }

  try {
    const { status, data } = await requestJson("/connect", "POST", {
      ssid,
      password,
    });
    res.status(status).json(data);
  } catch {
    res.status(500).json({ message: "No se pudo conectar" });
  }
}
