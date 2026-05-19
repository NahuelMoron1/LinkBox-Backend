"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const morgan_1 = __importDefault(require("morgan"));
const socket_io_1 = require("socket.io");
// Routes
const Device_1 = __importDefault(require("../routes/Device"));
// Database
const connection_1 = __importDefault(require("../db/connection"));
const config_1 = require("./config");
// Models - Ensure proper initialization
class Server {
    constructor() {
        this.app = (0, express_1.default)();
        this.port = config_1.PORT;
        this.server = http_1.default.createServer(this.app);
        this.io = new socket_io_1.Server(this.server, {
            cors: {
                origin: config_1.ALLOWED_ORIGINS,
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
        this.io.on("connection", (socket) => {
            console.log("Cliente conectado:", socket.id);
            socket.on("joinRoom", (deviceKey) => {
                socket.join(deviceKey);
                console.log(`Socket ${socket.id} se unió a la sala: ${deviceKey}`);
            });
            socket.on("disconnect", () => {
                console.log("Cliente desconectado");
            });
        });
        this.app.set("socketio", this.io);
    }
    listen() {
        this.server.listen(this.port, () => {
            console.log("LinkBox Server listening on port ", this.port);
        });
    }
    middlewares() {
        this.app.use(express_1.default.json());
        this.app.use((0, morgan_1.default)("dev"));
        this.app.use((0, cors_1.default)({
            origin: config_1.ALLOWED_ORIGINS,
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            credentials: true,
        }));
        this.app.use((0, cookie_parser_1.default)());
    }
    routes() {
        this.app.get("/", (req, res) => {
            res.json({ msg: "LinkBox API working" });
        });
        this.app.use("/api/devices", Device_1.default);
    }
    dbConnect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!config_1.MAINTENANCE) {
                try {
                    yield connection_1.default.authenticate();
                    console.log("DATABASE CONNECTED: " + config_1.DB_NAME);
                    // Models are auto-initialized on import via sequelize.define()
                }
                catch (err) {
                    console.error("Error connecting to DB:", err);
                }
            }
        });
    }
}
exports.default = Server;
