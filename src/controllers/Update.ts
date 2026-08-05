import { Request, Response } from "express";
import { execSync, spawn } from "child_process";
import { existsSync } from "fs";
import { Server as SocketServer } from "socket.io";
import path from "path";

const SERVER_DIR = process.cwd();
const FRONTEND_DIR = path.join(SERVER_DIR, "../frontend");
const BRANCH = "Dashboard_Only";
const SCRIPT_PATH = path.join(SERVER_DIR, "scripts/run-update.sh");

interface UpdateInfo { version: string; }

let installing = false;

async function findUpdate(): Promise<UpdateInfo | null> {
  try {
    execSync(`git -C "${SERVER_DIR}" fetch origin ${BRANCH} --quiet`, { timeout: 15000 });
    const local  = execSync(`git -C "${SERVER_DIR}" rev-parse HEAD`).toString().trim();
    const remote = execSync(`git -C "${SERVER_DIR}" rev-parse origin/${BRANCH}`).toString().trim();
    if (local !== remote) return { version: remote.substring(0, 7) };

    if (existsSync(FRONTEND_DIR)) {
      execSync(`git -C "${FRONTEND_DIR}" fetch origin main --quiet`, { timeout: 15000 });
      const localFE  = execSync(`git -C "${FRONTEND_DIR}" rev-parse HEAD`).toString().trim();
      const remoteFE = execSync(`git -C "${FRONTEND_DIR}" rev-parse origin/main`).toString().trim();
      if (localFE !== remoteFE) return { version: remoteFE.substring(0, 7) };
    }

    return null;
  } catch {
    // sin internet o error de git
    return null;
  }
}

export async function check(_req: Request, res: Response): Promise<void> {
  const update = await findUpdate();
  res.json({ available: update !== null, version: update?.version ?? null });
}

export function install(req: Request, res: Response): void {
  if (installing) {
    res.status(409).json({ message: "Ya hay una actualización en curso" });
    return;
  }

  const io: SocketServer = req.app.get("socketio");
  installing = true;
  res.json({ message: "Instalación iniciada" });

  const child = spawn("bash", [SCRIPT_PATH], { cwd: SERVER_DIR });

  child.stdout.on("data", (data: Buffer) => {
    data.toString().split("\n").forEach((rawLine) => {
      const line = rawLine.trim();
      if (line.startsWith("STATUS:")) {
        io.emit("update:progress", { step: line.slice(7) });
      }
    });
  });

  child.on("close", (code: number | null) => {
    installing = false;
    io.emit("update:complete", { success: code === 0 });
  });
}
