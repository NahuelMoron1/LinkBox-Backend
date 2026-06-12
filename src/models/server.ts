import cors from "cors";
import rateLimit from "express-rate-limit";
import express, { Application, Request, Response } from "express";
import http from "http";
import morgan from "morgan";
import path from "path";
import { Server as SocketServer } from "socket.io";

import deviceRouter from "../routes/Device";
import updateRouter from "../routes/Update";
import { checkForUpdates, getPendingUpdate } from "../controllers/Update";
import { PORT } from "./config";

const ANGULAR_DIST = path.join(process.cwd(), "../LinkBoxApp/dist/link-box-app/browser");

class Server {
  private app: Application;
  private port?: string;
  private server: http.Server;
  private io: SocketServer;

  constructor() {
    this.app = express();
    this.port = PORT;

    this.server = http.createServer(this.app);

    this.io = new SocketServer(this.server, {
      cors: { origin: "*", methods: ["GET", "POST"] },
    });

    this.middlewares();
    this.routes();
    this.sockets();
    this.listen();
  }

  sockets() {
    this.io.on("connection", (socket) => {
      // If an update was found before this client connected, notify it immediately
      const pending = getPendingUpdate();
      if (pending) socket.emit("update:available", pending);

      socket.on("disconnect", () => {});
    });

    this.app.set("socketio", this.io);
  }

  listen() {
    this.server.listen(this.port, () => {
      console.log("LinkBox Dashboard Server listening on port", this.port);
      // Check for updates 60 s after boot (gives time for WiFi to settle)
      setTimeout(() => checkForUpdates(this.io), 60_000);
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
    this.app.use("/api/devices", deviceRouter);
    this.app.use("/api/update", updateRouter);

    // Serve Angular build
    this.app.use(express.static(ANGULAR_DIST));

    // Catch-all: let Angular handle client-side routing
    this.app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(ANGULAR_DIST, "index.html"));
    });
  }
}

export default Server;
