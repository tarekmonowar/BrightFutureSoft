//X-API-Key Auth Middleware — Unit Tests

import type { Request, Response, NextFunction } from "express";
import { apiKeyAuth } from "../../src/middleware/auth.middleware";
import { AuthenticationError } from "../../src/utils/errors";

function createMocks(headers: Record<string, string> = {}) {
  const req = {
    headers: Object.fromEntries(
      Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]),
    ),
  } as unknown as Request;

  const res = {} as Response;

  const next = jest.fn() as jest.MockedFunction<NextFunction>;

  return { req, res, next };
}

describe("apiKeyAuth Middleware", () => {
  const VALID_KEY = "test-api-key-12345"; // matches setup.ts process.env.API_KEY

  it("should call next() with no error when X-API-Key is valid", () => {
    const { req, res, next } = createMocks({ "X-API-Key": VALID_KEY });

    apiKeyAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(); // no arguments = success
  });

  it("should call next() with AuthenticationError when X-API-Key is missing", () => {
    const { req, res, next } = createMocks({}); // no headers

    apiKeyAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(AuthenticationError));
  });

  it("should call next() with AuthenticationError when X-API-Key is wrong", () => {
    const { req, res, next } = createMocks({ "X-API-Key": "wrong-key" });

    apiKeyAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(AuthenticationError));
  });

  it("should call next() with AuthenticationError when X-API-Key is empty string", () => {
    const { req, res, next } = createMocks({ "X-API-Key": "" });

    apiKeyAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(AuthenticationError));
  });

  it("should be case-insensitive for the header name (x-api-key lowercase)", () => {
    const { req, res, next } = createMocks({ "x-api-key": VALID_KEY });

    apiKeyAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });
});
