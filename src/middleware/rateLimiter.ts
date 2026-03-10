import rateLimit from "express-rate-limit";
import { config } from "../config";
import { logger } from "../utils/logger";

// Applied only to POST /api/v1/whatsapp/send-message
export const sendMessageRateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip ?? "unknown",
  handler: (req, res) => {
    logger.warn(
      {
        ip: req.ip,
        path: req.path,
        windowMs: config.RATE_LIMIT_WINDOW_MS,
        max: config.RATE_LIMIT_MAX,
      },
      "RateLimit: send-message limit exceeded",
    );
    res.status(429).json({
      success: false,
      error: "Too many requests — please slow down",
      retryAfterSeconds: Math.ceil(config.RATE_LIMIT_WINDOW_MS / 1_000),
    });
  },
});

// ─── Global rate limiter ──── Broad safety-net applied to every route — 300 req / min per IP
export const globalRateLimiter = rateLimit({
  windowMs: 60_000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip ?? "unknown",
  handler: (req, res) => {
    logger.warn({ ip: req.ip }, "RateLimit: global limit exceeded");
    res.status(429).json({
      success: false,
      error: "Too many requests",
    });
  },
});
