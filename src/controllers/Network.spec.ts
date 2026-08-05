import { Request, Response } from "express";

jest.mock("http", () => ({ request: jest.fn() }));

function mockRes() {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function mockHttpRequestSuccess(http: any, body: unknown, statusCode = 200) {
  http.request.mockImplementation((_url: string, _opts: any, callback: any) => {
    const res: any = {
      statusCode,
      on: jest.fn((event: string, handler: any) => {
        if (event === "data") handler(Buffer.from(JSON.stringify(body)));
        if (event === "end") handler();
      }),
    };
    callback(res);
    return { on: jest.fn(), end: jest.fn(), write: jest.fn(), destroy: jest.fn() };
  });
}

function mockHttpRequestError(http: any) {
  http.request.mockImplementation(() => {
    const req: any = {
      on: jest.fn((event: string, handler: any) => {
        if (event === "error") setImmediate(() => handler(new Error("connection refused")));
      }),
      end: jest.fn(),
      write: jest.fn(),
      destroy: jest.fn(),
    };
    return req;
  });
}

describe("Network controller", () => {
  let http: any;
  let Network: typeof import("./Network");

  beforeEach(() => {
    jest.resetModules();
    http = require("http");
    Network = require("./Network");
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("getStatus", () => {
    it("returns the helper's status", async () => {
      mockHttpRequestSuccess(http, { connected: true, ssid: "HomeWifi" });
      const res = mockRes();
      await Network.getStatus({} as Request, res);
      expect(res.json).toHaveBeenCalledWith({ connected: true, ssid: "HomeWifi" });
    });

    it("returns disconnected when the helper is unreachable", async () => {
      mockHttpRequestError(http);
      const res = mockRes();
      const promise = Network.getStatus({} as Request, res);
      await jest.runAllTimersAsync();
      await promise;
      expect(res.json).toHaveBeenCalledWith({ connected: false, ssid: null });
    });
  });

  describe("scan", () => {
    it("returns the network list", async () => {
      mockHttpRequestSuccess(http, { networks: [{ ssid: "HomeWifi", signal: 80, secured: true }] });
      const res = mockRes();
      await Network.scan({} as Request, res);
      expect(res.json).toHaveBeenCalledWith({ networks: [{ ssid: "HomeWifi", signal: 80, secured: true }] });
    });

    it("returns 500 when the helper reports a scan error", async () => {
      mockHttpRequestSuccess(http, { error: "No se pudo escanear redes: boom" });
      const res = mockRes();
      await Network.scan({} as Request, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it("returns 500 when the helper is unreachable", async () => {
      mockHttpRequestError(http);
      const res = mockRes();
      const promise = Network.scan({} as Request, res);
      await jest.runAllTimersAsync();
      await promise;
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("connect", () => {
    it("requires an ssid", async () => {
      const req = { body: {} } as Request;
      const res = mockRes();
      await Network.connect(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("rejects a non-string ssid", async () => {
      const req = { body: { ssid: 123 } } as unknown as Request;
      const res = mockRes();
      await Network.connect(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("forwards a successful connect", async () => {
      mockHttpRequestSuccess(http, { message: "Conectado", ssid: "HomeWifi" }, 200);
      const req = { body: { ssid: "HomeWifi", password: "secret" } } as Request;
      const res = mockRes();
      await Network.connect(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "Conectado", ssid: "HomeWifi" });
    });

    it("returns 500 when the helper is unreachable", async () => {
      mockHttpRequestError(http);
      const req = { body: { ssid: "HomeWifi" } } as Request;
      const res = mockRes();
      const promise = Network.connect(req, res);
      await jest.runAllTimersAsync();
      await promise;
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
