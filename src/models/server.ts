import cors from "cors";
import rateLimit from "express-rate-limit";
import express, { Application, Request, Response } from "express";
import fs from "fs";
import http from "http";
import morgan from "morgan";
import path from "path";
import { Server as SocketServer } from "socket.io";

import deviceRouter from "../routes/Device";
import updateRouter from "../routes/Update";
import networkRouter from "../routes/Network";
import { PORT } from "./config";

// En el contenedor Docker el build de Angular se copia a ANGULAR_DIST_PATH (ver Dockerfile);
// en desarrollo local se sirve directo desde el checkout hermano de LinkBoxApp.
const ANGULAR_DIST =
  process.env.ANGULAR_DIST_PATH ||
  path.join(process.cwd(), "../LinkBoxApp/dist/link-box-app/browser");

export function readVersion(): string {
  try {
    return fs.readFileSync(path.join(process.cwd(), "VERSION"), "utf-8").trim();
  } catch {
    return process.env.APP_VERSION || "0.0.0-dev";
  }
}

interface ServerOptions {
  listen?: boolean;
}

class Server {
  public app: Application;
  private port?: string;
  private server: http.Server;
  private io: SocketServer;

  constructor(options: ServerOptions = {}) {
    this.app = express();
    this.port = PORT;

    this.server = http.createServer(this.app);

    this.io = new SocketServer(this.server, {
      cors: { origin: "*", methods: ["GET", "POST"] },
    });

    this.middlewares();
    this.routes();
    this.sockets();

    if (options.listen !== false) {
      this.listen();
    }
  }

  sockets() {
    this.io.on("connection", (socket) => {
      socket.on("disconnect", () => {});
    });

    this.app.set("socketio", this.io);
  }

  listen() {
    this.server.listen(this.port, () => {
      console.log("LinkBox Dashboard Server listening on port", this.port);
    });
  }

  middlewares() {
    this.app.use(express.json({ limit: "16kb" }));
    this.app.use(morgan("dev"));
    this.app.use(cors({ origin: "*" }));

    const telemetryLimiter = rateLimit({
      windowMs: 1000,
      max: 50,
      message: { message: "Telemetry rate limit exceeded" },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use("/api/devices/telemetry", telemetryLimiter);
  }

  routes() {
    // Usado por el HEALTHCHECK de Docker y por el updater del host para
    // confirmar que el contenedor nuevo levantó bien antes del swap.
    this.app.get("/health", (_req: Request, res: Response) => {
      res.json({ status: "ok", version: readVersion() });
    });

    // Chiquito, sin datos personales — lo usa el badge del dashboard para
    // identificar la unidad (LINKBOX_DEVICE_ID lo genera setup.sh una sola
    // vez, ver linkbox-deploy/setup.sh y linkbox-fleet/README.md).
    this.app.get("/api/device/info", (_req: Request, res: Response) => {
      res.json({ deviceId: process.env.LINKBOX_DEVICE_ID || null, version: readVersion() });
    });

    this.app.use("/api/devices", deviceRouter);
    this.app.use("/api/update", updateRouter);
    this.app.use("/api/network", networkRouter);

    // Serve Angular build
    this.app.use(express.static(ANGULAR_DIST));

    // Catch-all: let Angular handle client-side routing
    this.app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(ANGULAR_DIST, "index.html"));
    });
  }
}

export default Server;
