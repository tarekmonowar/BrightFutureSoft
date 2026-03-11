import express, { type Application } from "express";
import helmet from "helmet";
import cors from "cors";
import pinoHttp from "pino-http";
import { config } from "./config";
import { logger } from "./utils/logger";
import routes from "./routes";
import { globalRateLimiter } from "./middleware/rateLimiter";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import path from "path";

export function createApp(): Application {
  const app = express();

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          connectSrc: ["'self'", "ws:", "wss:"],
        },
      },
    }),
  );

  app.use(
    cors({
      origin: config.NODE_ENV === "production" ? false : "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type", "X-API-Key"],
    }),
  );

  app.use(express.static(path.join(__dirname, "../public")));
  app.set("trust proxy", 1);
  app.use(express.json({ limit: "16kb" }));
  app.use(express.urlencoded({ extended: true, limit: "16kb" }));

  // ── HTTP request logging (Pino)
  app.use(
    pinoHttp({
      logger,
      autoLogging: {
        ignore: (req) =>
          config.NODE_ENV === "production" && req.url === "/health",
      },
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return "error";
        if (res.statusCode >= 400) return "warn";
        return "info";
      },
    }),
  );

  // ── Global
  app.use(globalRateLimiter);
  app.use(routes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
