import { Request, Response } from "express";
import { execSync } from "child_process";
import { spawn } from "child_process";
import { existsSync } from "fs";
import { Server as SocketServer } from "socket.io";
import path from "path";

const SERVER_DIR = process.cwd();
const FRONTEND_DIR = path.join(SERVER_DIR, "../frontend");
const BRANCH = "Dashboard_Only";
const SCRIPT_PATH = path.join(SERVER_DIR, "scripts/run-update.sh");

export interface UpdateInfo { version: string; }

let pending: UpdateInfo | null = null;
let installing = false;

export function getPendingUpdate(): UpdateInfo | null { return pending; }

export async function checkForUpdates(io: SocketServer): Promise<void> {
  try {
    execSync(`git -C "${SERVER_DIR}" fetch origin ${BRANCH} --quiet`, { timeout: 15000 });
    const local  = execSync(`git -C "${SERVER_DIR}" rev-parse HEAD`).toString().trim();
    const remote = execSync(`git -C "${SERVER_DIR}" rev-parse origin/${BRANCH}`).toString().trim();

    if (local !== remote) {
      pending = { version: remote.substring(0, 7) };
      io.emit("update:available", pending);
      return;
    }

    if (existsSync(FRONTEND_DIR)) {
      execSync(`git -C "${FRONTEND_DIR}" fetch origin main --quiet`, { timeout: 15000 });
      const localFE  = execSync(`git -C "${FRONTEND_DIR}" rev-parse HEAD`).toString().trim();
      const remoteFE = execSync(`git -C "${FRONTEND_DIR}" rev-parse origin/main`).toString().trim();

      if (localFE !== remoteFE) {
        pending = { version: remoteFE.substring(0, 7) };
        io.emit("update:available", pending);
      }
    }
  } catch {
    // Sin internet o git no disponible — fallo silencioso
  }
}

export function getStatus(_req: Request, res: Response): void {
  res.json({ available: pending !== null, version: pending?.version ?? null, installing });
}

export function approve(req: Request, res: Response): void {
  if (!pending || installing) {
    res.status(400).json({ message: "No update pending or already installing" });
    return;
  }

  const io: SocketServer = req.app.get("socketio");
  installing = true;
  pending = null;
  res.json({ message: "Update started" });

  const child = spawn("bash", [SCRIPT_PATH], { cwd: SERVER_DIR });

  child.stdout.on("data", (data: Buffer) => {
    data.toString().split("\n").forEach((line) => {
      line = line.trim();
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

export function reject(_req: Request, res: Response): void {
  pending = null;
  res.json({ message: "Update skipped" });
}
