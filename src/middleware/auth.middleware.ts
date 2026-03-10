import type { Request, Response, NextFunction } from "express";
import { config } from "../config";
import { AuthenticationError } from "../utils/errors";

// Validates the X-API-Key request header against the configured API_KEY.
export function apiKeyAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const provided = req.headers["x-api-key"];

  if (!provided || provided !== config.API_KEY) {
    return next(new AuthenticationError());
  }

  next();
}
