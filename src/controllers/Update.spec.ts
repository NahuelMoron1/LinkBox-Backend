import { Request, Response } from "express";

jest.mock("http", () => ({ request: jest.fn() }));

function mockRes() {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function mockReqWithSocket() {
  const emit = jest.fn();
  const app = { get: jest.fn().mockReturnValue({ emit }) };
  const req = { app } as unknown as Request;
  return { req, emit };
}

/** Cada llamada a http.request devuelve la siguiente entrada de la cola. */
function mockHttpSequence(http: any, responses: Array<{ body: unknown }>) {
  let index = 0;
  http.request.mockImplementation((_url: string, _opts: any, callback: any) => {
    const entry = responses[Math.min(index, responses.length - 1)];
    index++;
    const res: any = {
      statusCode: 200,
      on: jest.fn((event: string, handler: any) => {
        if (event === "data") handler(Buffer.from(JSON.stringify(entry.body)));
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

describe("Update controller", () => {
  let http: any;
  let Update: typeof import("./Update");

  beforeEach(() => {
    jest.resetModules();
    http = require("http");
    Update = require("./Update");
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("check", () => {
    it("reports availability and version from the updater status", async () => {
      mockHttpSequence(http, [
        {
          body: {
            installedVersion: "v1.0.0",
            latestVersion: "v1.1.0",
            available: true,
            installing: false,
            progress: null,
            error: null,
          },
        },
      ]);
      const res = mockRes();
      await Update.check({} as Request, res);
      expect(res.json).toHaveBeenCalledWith({ available: true, version: "v1.1.0" });
    });

    it("reports unavailable when the updater cannot be reached", async () => {
      mockHttpRequestError(http);
      const res = mockRes();
      const promise = Update.check({} as Request, res);
      await jest.runAllTimersAsync();
      await promise;
      expect(res.json).toHaveBeenCalledWith({ available: false, version: null });
    });
  });

  describe("install", () => {
    it("returns 502 when the updater cannot be reached", async () => {
      mockHttpRequestError(http);
      const { req } = mockReqWithSocket();
      const res = mockRes();
      const promise = Update.install(req, res);
      await jest.runAllTimersAsync();
      await promise;
      expect(res.status).toHaveBeenCalledWith(502);
    });

    it("starts the install and responds with the updater message", async () => {
      mockHttpSequence(http, [{ body: { message: "instalación iniciada" } }]);
      const { req } = mockReqWithSocket();
      const res = mockRes();
      await Update.install(req, res);
      expect(res.json).toHaveBeenCalledWith({ message: "instalación iniciada" });
    });

    it("polls progress and emits update:progress / update:complete over the socket", async () => {
      mockHttpSequence(http, [
        { body: { message: "instalación iniciada" } },
        {
          body: {
            installedVersion: "v1.0.0",
            latestVersion: "v1.1.0",
            installing: true,
            progress: "downloading",
            error: null,
          },
        },
        {
          body: {
            installedVersion: "v1.0.0",
            latestVersion: "v1.1.0",
            installing: true,
            progress: "healthcheck",
            error: null,
          },
        },
        {
          body: {
            installedVersion: "v1.1.0",
            latestVersion: "v1.1.0",
            installing: false,
            progress: "done",
            error: null,
          },
        },
      ]);
      const { req, emit } = mockReqWithSocket();
      const res = mockRes();
      await Update.install(req, res);

      await jest.advanceTimersByTimeAsync(1000);
      await jest.advanceTimersByTimeAsync(1000);
      await jest.advanceTimersByTimeAsync(1000);

      expect(emit).toHaveBeenCalledWith("update:progress", { step: "downloading" });
      expect(emit).toHaveBeenCalledWith("update:progress", { step: "healthcheck" });
      expect(emit).toHaveBeenCalledWith("update:progress", { step: "done" });
      expect(emit).toHaveBeenCalledWith("update:complete", { success: true, error: null });
    });

    it("reports failure via update:complete when the updater ends with an error", async () => {
      mockHttpSequence(http, [
        { body: { message: "instalación iniciada" } },
        {
          body: {
            installedVersion: "v1.0.0",
            latestVersion: "v1.1.0",
            installing: false,
            progress: "error:healthcheck_failed",
            error: "la versión nueva no pasó el healthcheck",
          },
        },
      ]);
      const { req, emit } = mockReqWithSocket();
      const res = mockRes();
      await Update.install(req, res);

      await jest.advanceTimersByTimeAsync(1000);

      expect(emit).toHaveBeenCalledWith("update:progress", { step: "error:healthcheck_failed" });
      expect(emit).toHaveBeenCalledWith("update:complete", {
        success: false,
        error: "la versión nueva no pasó el healthcheck",
      });
    });
  });
});
