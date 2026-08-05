import { Request, Response } from "express";
import { postTelemetry } from "./Telemetry";

function mockRes() {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function mockReq(data: unknown) {
  const emit = jest.fn();
  const app = { get: jest.fn().mockReturnValue({ emit }) };
  const req = { body: { data }, app } as unknown as Request;
  return { req, emit };
}

describe("postTelemetry", () => {
  it("rejects data that is not a plain object", () => {
    const { req } = mockReq("not-an-object");
    const res = mockRes();
    postTelemetry(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("rejects array data", () => {
    const { req } = mockReq([]);
    const res = mockRes();
    postTelemetry(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("rejects null data", () => {
    const { req } = mockReq(null);
    const res = mockRes();
    postTelemetry(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("emits liveTelemetry and responds 200 for valid data", () => {
    const { req, emit } = mockReq({ rpm: 5000 });
    const res = mockRes();
    postTelemetry(req, res);
    expect(emit).toHaveBeenCalledWith("liveTelemetry", { rpm: 5000 });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("nulls fields outside their valid range", () => {
    const { req, emit } = mockReq({ rpm: 999999, oil_press: -5 });
    const res = mockRes();
    postTelemetry(req, res);
    expect(emit).toHaveBeenCalledWith("liveTelemetry", expect.objectContaining({ rpm: null, oil_press: null }));
  });

  it("nulls non-numeric field values", () => {
    const { req, emit } = mockReq({ gear: "abc" });
    const res = mockRes();
    postTelemetry(req, res);
    expect(emit).toHaveBeenCalledWith("liveTelemetry", expect.objectContaining({ gear: null }));
  });

  it("leaves undefined and null fields untouched", () => {
    const { req, emit } = mockReq({ rpm: undefined, gear: null, water_temp: 90 });
    const res = mockRes();
    postTelemetry(req, res);
    expect(emit).toHaveBeenCalledWith(
      "liveTelemetry",
      expect.objectContaining({ rpm: undefined, gear: null, water_temp: 90 })
    );
  });

  it("passes through fields it does not know about unchanged", () => {
    const { req, emit } = mockReq({ rpm: 3000, extra_field: "whatever" });
    const res = mockRes();
    postTelemetry(req, res);
    expect(emit).toHaveBeenCalledWith("liveTelemetry", expect.objectContaining({ extra_field: "whatever" }));
  });
});
