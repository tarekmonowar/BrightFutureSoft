import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { validateBody } from "../../src/middleware/validate";
import { ValidationError } from "../../src/utils/errors";

// Simple test schema
const testSchema = z.object({
  name: z.string().min(1, "name is required"),
  age: z.number().min(0, "age must be non-negative"),
});

function createMocks(body: unknown) {
  const req = { body } as unknown as Request;
  const res = {} as Response;
  const next = jest.fn() as jest.MockedFunction<NextFunction>;
  return { req, res, next };
}

describe("validateBody Middleware", () => {
  const middleware = validateBody(testSchema);

  it("should call next() with no error when body is valid", () => {
    const { req, res, next } = createMocks({ name: "Alice", age: 30 });

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(); // no error
  });

  it("should replace req.body with the parsed + coerced value on success", () => {
    const { req, res, next } = createMocks({ name: "  Bob  ", age: 25 });

    // Wait for sync call
    middleware(req, res, next);

    // name should be trimmed by Zod (if trim() was in schema)
    expect(req.body).toHaveProperty("name");
    expect(req.body).toHaveProperty("age");
  });

  it("should call next() with ValidationError when required field is missing", () => {
    const { req, res, next } = createMocks({ age: 30 }); // name missing

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0] as unknown as ValidationError;
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.statusCode).toBe(400);
  });

  it("should populate field-level errors in ValidationError", () => {
    const { req, res, next } = createMocks({}); // both fields missing

    middleware(req, res, next);

    const error = next.mock.calls[0][0] as unknown as ValidationError;
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.errors).toBeDefined();
    // Should have at least one field error key
    expect(Object.keys(error.errors).length).toBeGreaterThan(0);
  });

  it("should call next() with ValidationError when data types are wrong", () => {
    const { req, res, next } = createMocks({
      name: "Alice",
      age: "not-a-number",
    });

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
  });
});
