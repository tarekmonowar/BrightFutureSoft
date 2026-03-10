import type { Request, Response, NextFunction } from "express";
import { AppError, ValidationError } from "../utils/errors";
import { logger } from "../utils/logger";
import { config } from "../config";

// ─── Response shape ───
interface ErrorBody {
  success: false;
  error: string;
  errors?: Record<string, string[]>;
  stack?: string;
}

// ─── 404 catch-all ───────
export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.path}`,
  } satisfies ErrorBody);
}

// ─── Centralised error handler
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  const isDev = config.NODE_ENV !== "production";

  if (err instanceof ValidationError) {
    logger.warn(
      { path: req.path, method: req.method, errors: err.errors },
      `ValidationError: ${err.message}`,
    );
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      errors: err.errors,
      ...(isDev && { stack: err.stack }),
    } satisfies ErrorBody);
    return;
  }

  if (err instanceof AppError) {
    if (err.isOperational) {
      logger.warn(
        { path: req.path, method: req.method, statusCode: err.statusCode },
        `AppError: ${err.message}`,
      );
    } else {
      logger.error(
        { path: req.path, method: req.method, err },
        `Non-operational AppError: ${err.message}`,
      );
    }
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(isDev && { stack: err.stack }),
    } satisfies ErrorBody);
    return;
  }

  // ── Unknown / programming errors ───

  const message =
    err instanceof Error ? err.message : "An unexpected error occurred";
  const stack = err instanceof Error ? err.stack : undefined;

  logger.error(
    { path: req.path, method: req.method, err },
    `Unhandled error: ${message}`,
  );

  res.status(500).json({
    success: false,
    error: isDev ? message : "Internal server error",
    ...(isDev && stack && { stack }),
  } satisfies ErrorBody);
}
