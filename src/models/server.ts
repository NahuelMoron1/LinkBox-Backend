import cookieParser from "cookie-parser";
import cors from "cors";
import rateLimit from "express-rate-limit";
import express, { Application, Request, Response } from "express";
import helmet from "helmet";
import http from "http";
import jwt from "jsonwebtoken";
import morgan from "morgan";
import { Server as SocketServer } from "socket.io";

// Routes
import deviceRouter from "../routes/Device";
import subscriptionRouter from "../routes/Subscription";
import { stripeWebhook } from "../controllers/StripeWebhook";

// Database
import db from "../db/connection";
import { ALLOWED_ORIGINS, DB_NAME, MAINTENANCE, PORT, SECRET_JWT_KEY } from "./config";

// Models - Ensure proper initialization

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
      cors: {
        origin: ALLOWED_ORIGINS,
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    this.middlewares();
    this.routes();
    this.sockets();
    this.dbConnect();
    this.listen();
  }

  sockets() {
    this.io.use((socket, next) => {
      const cookieStr = socket.handshake.headers.cookie || "";
      const match = cookieStr.match(/(?:^|;\s*)access_token=([^;]+)/);
      const token = match ? decodeURIComponent(match[1]) : null;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      try {
        const decoded = jwt.verify(token, SECRET_JWT_KEY) as any;
        socket.data.deviceId = decoded.id;
        next();
      } catch {
        next(new Error("Invalid or expired token"));
      }
    });

    this.io.on("connection", (socket) => {
      socket.on("joinRoom", (roomKey: string) => {
        if (socket.data.deviceId === roomKey) {
          socket.join(roomKey);
        } else {
          socket.emit("unauthorized", { message: "You can only join your own room" });
        }
      });

      socket.on("disconnect", () => {});
    });

    this.app.set("socketio", this.io);
  }

  listen() {
    this.server.listen(this.port, () => {
      console.log("LinkBox Server listening on port ", this.port);
    });
  }

  middlewares() {
    // Security headers
    this.app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

    // Stripe webhook necesita el body RAW (antes del json parser)
    this.app.use(
      "/api/webhooks/stripe",
      express.raw({ type: "application/json" }),
    );

    // Body size limit — previene payloads gigantes
    this.app.use(express.json({ limit: "16kb" }));

    this.app.use(morgan("dev"));
    this.app.use(
      cors({
        origin: ALLOWED_ORIGINS,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        credentials: true,
      }),
    );
    this.app.use(cookieParser());

    // Rate limiting en login: máx 10 intentos por IP por 15 minutos
    const loginLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 10,
      message: { message: "Too many login attempts, please try again in 15 minutes" },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use("/api/devices/login", loginLimiter);

    // Rate limiting en telemetría: máx 30 req/seg por IP (100ms * 10 dispositivos)
    const telemetryLimiter = rateLimit({
      windowMs: 1000,
      max: 30,
      message: { message: "Telemetry rate limit exceeded" },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use("/api/devices/telemetry", telemetryLimiter);
  }

  routes() {
    this.app.get("/", (req: Request, res: Response) => {
      res.json({ msg: "LinkBox API working" });
    });
    this.app.use("/api/devices", deviceRouter);
    this.app.use("/api/subscriptions", subscriptionRouter);

    // Webhook de Stripe: body ya viene raw por el middleware registrado arriba
    this.app.post("/api/webhooks/stripe", stripeWebhook);
  }

  async dbConnect() {
    if (!MAINTENANCE) {
      try {
        await db.authenticate();
        console.log("DATABASE CONNECTED: " + DB_NAME);
        // Models are auto-initialized on import via sequelize.define()
      } catch (err) {
        console.error("Error connecting to DB:", err);
      }
    }
  }
}

export default Server;
