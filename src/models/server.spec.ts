import fs from "fs";
import http from "http";
import request from "supertest";
import { io as ioClient } from "socket.io-client";
import Server, { readVersion } from "./server";

describe("Server", () => {
  const originalPort = process.env.PORT;

  afterAll(() => {
    process.env.PORT = originalPort;
  });

  it("exposes GET /health with status ok and a version", async () => {
    process.env.PORT = "0";
    const server = new Server({ listen: false });
    const res = await request(server.app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", version: expect.any(String) });
  });

  it("exposes GET /api/device/info with the device id when set", async () => {
    const originalDeviceId = process.env.LINKBOX_DEVICE_ID;
    process.env.LINKBOX_DEVICE_ID = "test-device-123";
    const server = new Server({ listen: false });
    const res = await request(server.app).get("/api/device/info");
    process.env.LINKBOX_DEVICE_ID = originalDeviceId;
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      deviceId: "test-device-123",
      version: expect.any(String),
      shiftRpm: expect.any(Number),
    });
  });

  it("exposes shiftRpm from LINKBOX_SHIFT_RPM, defaulting to 6500 when unset", async () => {
    const original = process.env.LINKBOX_SHIFT_RPM;
    delete process.env.LINKBOX_SHIFT_RPM;
    const serverDefault = new Server({ listen: false });
    const resDefault = await request(serverDefault.app).get("/api/device/info");
    expect(resDefault.body.shiftRpm).toBe(6500);

    process.env.LINKBOX_SHIFT_RPM = "6200";
    const serverCustom = new Server({ listen: false });
    const resCustom = await request(serverCustom.app).get("/api/device/info");
    process.env.LINKBOX_SHIFT_RPM = original;
    expect(resCustom.body.shiftRpm).toBe(6200);
  });

  it("exposes GET /api/device/info with a null deviceId when unset", async () => {
    const originalDeviceId = process.env.LINKBOX_DEVICE_ID;
    delete process.env.LINKBOX_DEVICE_ID;
    const server = new Server({ listen: false });
    const res = await request(server.app).get("/api/device/info");
    process.env.LINKBOX_DEVICE_ID = originalDeviceId;
    expect(res.body.deviceId).toBeNull();
  });

  it("sets the socketio instance on the app", () => {
    const server = new Server({ listen: false });
    expect(server.app.get("socketio")).toBeDefined();
  });

  it("registers the API routers", async () => {
    const server = new Server({ listen: false });
    // Cuerpo inválido a propósito — solo nos interesa que la ruta exista
    // (404 significaría que el router no está montado).
    const res = await request(server.app).post("/api/devices/telemetry").send({});
    expect(res.status).not.toBe(404);
  });

  it("falls through to the Angular catch-all for unknown routes and attempts to serve index.html", async () => {
    process.env.ANGULAR_DIST_PATH = "/tmp/linkbox-test-nonexistent-dist";
    let ServerWithFakeDist: typeof Server;
    jest.isolateModules(() => {
      ServerWithFakeDist = require("./server").default;
    });
    const server = new ServerWithFakeDist!({ listen: false });
    const res = await request(server.app).get("/some/unknown/route");
    delete process.env.ANGULAR_DIST_PATH;
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("listen() binds the HTTP server, accepts a socket connection, and cleans it up on disconnect", async () => {
    process.env.PORT = "0";
    const server = new Server({ listen: false });
    server.listen();

    const address = (server as unknown as { server: http.Server }).server.address();
    const port = typeof address === "object" && address ? address.port : 0;

    await new Promise<void>((resolve, reject) => {
      const client = ioClient(`http://127.0.0.1:${port}`, { reconnection: false, timeout: 2000 });
      client.on("connect", () => client.close());
      client.on("connect_error", reject);
      client.on("disconnect", () => resolve());
    });

    await new Promise<void>((resolve) => {
      (server as unknown as { server: http.Server }).server.close(() => resolve());
    });
  }, 10000);
});

describe("readVersion", () => {
  const originalAppVersion = process.env.APP_VERSION;

  afterEach(() => {
    process.env.APP_VERSION = originalAppVersion;
    jest.restoreAllMocks();
  });

  it("reads the version from the VERSION file when present", () => {
    jest.spyOn(fs, "readFileSync").mockReturnValue("v9.9.9\n");
    expect(readVersion()).toBe("v9.9.9");
  });

  it("falls back to APP_VERSION when there is no VERSION file", () => {
    jest.spyOn(fs, "readFileSync").mockImplementation(() => {
      throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
    });
    process.env.APP_VERSION = "v0.0.1-fallback";
    expect(readVersion()).toBe("v0.0.1-fallback");
  });

  it("falls back to a dev default when there is no VERSION file nor APP_VERSION", () => {
    jest.spyOn(fs, "readFileSync").mockImplementation(() => {
      throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
    });
    delete process.env.APP_VERSION;
    expect(readVersion()).toBe("0.0.0-dev");
  });
});
