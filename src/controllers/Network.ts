import { Request, Response } from "express";
import { execFileSync } from "child_process";

interface WifiNetwork {
  ssid: string;
  signal: number;
  secured: boolean;
}

function nmcli(args: string[], timeout = 10000): string {
  return execFileSync("sudo", ["nmcli", ...args], { timeout }).toString();
}

export function getStatus(_req: Request, res: Response): void {
  try {
    const output = nmcli(["-t", "-f", "ACTIVE,SSID", "dev", "wifi"]);
    const active = output.split("\n").find((l) => l.startsWith("yes:"));
    const ssid = active ? active.split(":")[1] : null;
    res.json({ connected: !!ssid, ssid });
  } catch {
    res.json({ connected: false, ssid: null });
  }
}

export function scan(_req: Request, res: Response): void {
  try {
    nmcli(["device", "wifi", "rescan"]);
  } catch {
    // un escaneo puede estar ya en curso — listamos lo que haya igual
  }

  try {
    const output = nmcli(["-t", "-f", "SSID,SIGNAL,SECURITY", "device", "wifi", "list"]);
    const seen = new Map<string, WifiNetwork>();

    output.split("\n").forEach((line) => {
      const [ssid, signal, security] = line.split(":");
      if (!ssid) return;
      const network: WifiNetwork = {
        ssid,
        signal: Number(signal) || 0,
        secured: !!security && security !== "--",
      };
      const existing = seen.get(ssid);
      if (!existing || network.signal > existing.signal) seen.set(ssid, network);
    });

    res.json({ networks: [...seen.values()].sort((a, b) => b.signal - a.signal) });
  } catch {
    res.status(500).json({ message: "No se pudo escanear redes" });
  }
}

export function connect(req: Request, res: Response): void {
  const { ssid, password } = req.body;
  if (!ssid || typeof ssid !== "string") {
    res.status(400).json({ message: "SSID requerido" });
    return;
  }

  try {
    const args = password && typeof password === "string"
      ? ["device", "wifi", "connect", ssid, "password", password]
      : ["device", "wifi", "connect", ssid];
    nmcli(args, 30000);
    res.json({ message: "Conectado", ssid });
  } catch {
    res.status(500).json({ message: "No se pudo conectar" });
  }
}
