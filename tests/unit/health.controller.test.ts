import type { Request, Response } from "express";
import { healthCheck } from "../../src/modules/health/health.controller";

describe("healthCheck Controller", () => {
  function createMocks() {
    const req = {} as Request;

    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const res = { status, json } as unknown as Response;

    (res as any).json = json;

    return { req, res, json, status };
  }

  it("should respond with HTTP 200", () => {
    const { req, res, status } = createMocks();

    healthCheck(req, res);

    expect(status).toHaveBeenCalledWith(200);
  });

  it("should return body with status: 'ok'", () => {
    const { req, res, status, json } = createMocks();

    healthCheck(req, res);

    expect(status).toHaveBeenCalledWith(200);
    const body = json.mock.calls[0][0];
    expect(body).toHaveProperty("status", "ok");
  });

  it("should return uptime as a non-negative number", () => {
    const { req, res, json, status } = createMocks();

    healthCheck(req, res);

    expect(status).toHaveBeenCalledWith(200);
    const body = json.mock.calls[0][0];
    expect(typeof body.uptime).toBe("number");
    expect(body.uptime).toBeGreaterThanOrEqual(0);
  });

  it("should return a valid ISO 8601 timestamp", () => {
    const { req, res, json, status } = createMocks();

    healthCheck(req, res);

    expect(status).toHaveBeenCalledWith(200);
    const body = json.mock.calls[0][0];
    expect(typeof body.timestamp).toBe("string");
    const parsed = new Date(body.timestamp);
    expect(parsed.toString()).not.toBe("Invalid Date");
  });

  it("should return a version string", () => {
    const { req, res, json, status } = createMocks();

    healthCheck(req, res);

    expect(status).toHaveBeenCalledWith(200);
    const body = json.mock.calls[0][0];
    expect(typeof body.version).toBe("string");
    expect(body.version.length).toBeGreaterThan(0);
  });
});
