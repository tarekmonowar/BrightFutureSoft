import {
  AppError,
  ValidationError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  TooManyRequestsError,
  ServiceUnavailableError,
  isAppError,
} from "../../src/utils/errors";

describe("Custom Error Classes", () => {
  // ── AppError

  describe("AppError", () => {
    it("should set message, statusCode, and isOperational correctly", () => {
      const err = new AppError("Something broke", 503, true);

      expect(err.message).toBe("Something broke");
      expect(err.statusCode).toBe(503);
      expect(err.isOperational).toBe(true);
      expect(err.name).toBe("AppError");
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(AppError);
    });

    it("should default to 500 and operational = true", () => {
      const err = new AppError("fail");

      expect(err.statusCode).toBe(500);
      expect(err.isOperational).toBe(true);
    });
  });

  // ── ValidationError

  describe("ValidationError", () => {
    it("should default to status 400 with empty errors", () => {
      const err = new ValidationError();

      expect(err.statusCode).toBe(400);
      expect(err.message).toBe("Validation failed");
      expect(err.errors).toEqual({});
      expect(err).toBeInstanceOf(ValidationError);
      expect(err).toBeInstanceOf(AppError);
    });

    it("should carry field-level errors", () => {
      const fieldErrors = { to: ["to is required"], message: ["too long"] };
      const err = new ValidationError("Bad input", fieldErrors);

      expect(err.errors).toEqual(fieldErrors);
    });
  });

  // ── AuthenticationError

  describe("AuthenticationError", () => {
    it("should default to status 401", () => {
      const err = new AuthenticationError();

      expect(err.statusCode).toBe(401);
      expect(err.message).toBe("Unauthorized — invalid or missing API key");
      expect(err).toBeInstanceOf(AuthenticationError);
    });
  });

  // ── ForbiddenError

  describe("ForbiddenError", () => {
    it("should default to status 403", () => {
      const err = new ForbiddenError();
      expect(err.statusCode).toBe(403);
    });
  });

  // ── NotFoundError

  describe("NotFoundError", () => {
    it("should default to status 404", () => {
      const err = new NotFoundError();
      expect(err.statusCode).toBe(404);
    });
  });

  // ── ConflictError

  describe("ConflictError", () => {
    it("should default to status 409", () => {
      const err = new ConflictError();
      expect(err.statusCode).toBe(409);
    });
  });

  // ── TooManyRequestsError

  describe("TooManyRequestsError", () => {
    it("should default to status 429", () => {
      const err = new TooManyRequestsError();
      expect(err.statusCode).toBe(429);
    });
  });

  // ── ServiceUnavailableError

  describe("ServiceUnavailableError", () => {
    it("should default to status 503", () => {
      const err = new ServiceUnavailableError();
      expect(err.statusCode).toBe(503);
    });
  });

  // ── isAppError type guard

  describe("isAppError()", () => {
    it("should return true for AppError instances", () => {
      expect(isAppError(new AppError("test"))).toBe(true);
      expect(isAppError(new ValidationError())).toBe(true);
      expect(isAppError(new AuthenticationError())).toBe(true);
      expect(isAppError(new ServiceUnavailableError())).toBe(true);
    });

    it("should return false for plain Error or non-Error values", () => {
      expect(isAppError(new Error("plain"))).toBe(false);
      expect(isAppError("string")).toBe(false);
      expect(isAppError(null)).toBe(false);
      expect(isAppError(undefined)).toBe(false);
    });
  });
});
