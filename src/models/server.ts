import cors from "cors";
import rateLimit from "express-rate-limit";
import express, { Application, Request, Response } from "express";
import http from "http";
import morgan from "morgan";
import { Server as SocketServer } from "socket.io";

import deviceRouter from "../routes/Device";
import { PORT } from "./config";

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
    this.app.get("/", (_req: Request, res: Response) => {
      res.json({ msg: "LinkBox Dashboard API" });
    });
    this.app.use("/api/devices", deviceRouter);
  }
}

export default Server;
