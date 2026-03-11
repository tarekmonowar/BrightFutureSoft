import http from "http";
import { createApp } from "./app";
import { createSocketServer } from "./sockets/socket.server";
import { closeRedis } from "./config/redis";
import { config } from "./config";
import { logger } from "./utils/logger";
import { closeMessageQueue } from "./modules/message/message.queue";
import {
  startMessageWorker,
  stopMessageWorker,
} from "./modules/message/message.worker";
import { whatsappService } from "./modules/whatsapp/whatsapp.service";

async function bootstrap(): Promise<void> {
  const app = createApp();

  const httpServer = http.createServer(app);

  createSocketServer(httpServer);
  logger.info("Socket.IO server attached");

  startMessageWorker();
  logger.info("Message worker started");

  await new Promise<void>((resolve) => {
    httpServer.listen(config.PORT, () => resolve());
  });
  logger.info(
    { port: config.PORT, env: config.NODE_ENV },
    `Server listening on http://localhost:${config.PORT}`,
  );

  await whatsappService.initialize();

  // ── Graceful shutdown ──────

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, "Shutdown signal received — draining…");

    httpServer.close(async () => {
      logger.info("HTTP server closed");
    });

    try {
      await stopMessageWorker();
      await closeMessageQueue();
      await whatsappService.destroy();
      await closeRedis();
      logger.info("Graceful shutdown complete ✓");
      process.exit(0);
    } catch (err) {
      logger.error({ err }, "Error during graceful shutdown");
      process.exit(1);
    }
  };

  // Force-kill
  const forceExit = (): void => {
    logger.error("Shutdown timeout exceeded — forcing exit");
    process.exit(1);
  };

  process.on("SIGTERM", () => {
    setTimeout(forceExit, 30_000).unref();
    void shutdown("SIGTERM");
  });

  process.on("SIGINT", () => {
    setTimeout(forceExit, 30_000).unref();
    void shutdown("SIGINT");
  });

  // ── Safety nets ──

  process.on("unhandledRejection", (reason: unknown) => {
    logger.error({ reason }, "Unhandled Promise Rejection");
  });

  process.on("uncaughtException", (err: Error) => {
    logger.fatal({ err }, "Uncaught Exception — shutting down");
    process.exit(1);
  });
}

bootstrap().catch((err: unknown) => {
  logger.fatal({ err }, "Bootstrap failed — exiting");
  process.exit(1);
});
