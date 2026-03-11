// Tests the centralized Express error handler for all error types.

import type { Request, Response, NextFunction } from "express";
import {
  errorHandler,
  notFoundHandler,
} from "../../src/middleware/errorHandler";
import {
  AppError,
  ValidationError,
  AuthenticationError,
  ServiceUnavailableError,
} from "../../src/utils/errors";

// Helper to build mock req/res/next
function createMocks(method = "GET", path = "/test") {
  const req = { method, path } as unknown as Request;

  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const res = { status, json } as unknown as Response;

  const next = jest.fn() as jest.MockedFunction<NextFunction>;

  return { req, res, next, json, status };
}

describe("errorHandler Middleware", () => {
  it("should return 400 with field errors for ValidationError", () => {
    const { req, res, next, status, json } = createMocks();
    const err = new ValidationError("Validation failed", {
      to: ["to is required"],
    });

    errorHandler(err, req, res, next);

    expect(status).toHaveBeenCalledWith(400);
    const body = json.mock.calls[0][0];
    expect(body.success).toBe(false);
    expect(body.error).toBe("Validation failed");
    expect(body.errors).toEqual({ to: ["to is required"] });
  });

  it("should return 401 for AuthenticationError", () => {
    const { req, res, next, status, json } = createMocks();
    const err = new AuthenticationError();

    errorHandler(err, req, res, next);

    expect(status).toHaveBeenCalledWith(401);
    const body = json.mock.calls[0][0];
    expect(body.success).toBe(false);
    expect(body.error).toBe("Unauthorized — invalid or missing API key");
  });

  it("should return 503 for ServiceUnavailableError", () => {
    const { req, res, next, status, json } = createMocks();
    const err = new ServiceUnavailableError("WhatsApp not ready");

    errorHandler(err, req, res, next);

    expect(status).toHaveBeenCalledWith(503);
    const body = json.mock.calls[0][0];
    expect(body.success).toBe(false);
    expect(body.error).toBe("WhatsApp not ready");
  });

  it("should return custom statusCode for generic AppError", () => {
    const { req, res, next, status } = createMocks();
    const err = new AppError("Custom error", 422);

    errorHandler(err, req, res, next);

    expect(status).toHaveBeenCalledWith(422);
  });

  it("should return 500 for unknown errors", () => {
    const { req, res, next, status, json } = createMocks();
    const err = new Error("Unknown crash");

    errorHandler(err, req, res, next);

    expect(status).toHaveBeenCalledWith(500);
    const body = json.mock.calls[0][0];
    expect(body.success).toBe(false);
  });

  it("should return success: false for all error responses", () => {
    const cases = [
      new ValidationError(),
      new AuthenticationError(),
      new AppError("test"),
      new Error("plain"),
    ];

    cases.forEach((err) => {
      const { req, res, next, json } = createMocks();
      errorHandler(err, req, res, next);
      const body = json.mock.calls[0][0];
      expect(body.success).toBe(false);
    });
  });
});

describe("notFoundHandler Middleware", () => {
  it("should return 404 with method and path in error message", () => {
    const { res, next, status, json } = createMocks("GET", "/nonexistent");
    const req = { method: "GET", path: "/nonexistent" } as unknown as Request;

    notFoundHandler(req, res, next);

    expect(status).toHaveBeenCalledWith(404);
    const body = json.mock.calls[0][0];
    expect(body.success).toBe(false);
    expect(body.error).toContain("GET");
    expect(body.error).toContain("/nonexistent");
  });

  it("should return 404 for POST to unknown route", () => {
    const { res, next, status, json } = createMocks("POST", "/random");
    const req = { method: "POST", path: "/random" } as unknown as Request;

    notFoundHandler(req, res, next);

    expect(status).toHaveBeenCalledWith(404);
    const body = json.mock.calls[0][0];
    expect(body.error).toContain("POST");
    expect(body.error).toContain("/random");
  });
});
