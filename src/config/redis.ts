import Redis from "ioredis";
import { config } from "./index";
import { logger } from "../utils/logger";

// ─── ioredis singleton

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (redisClient) return redisClient;

  redisClient = new Redis(config.REDIS_URL, {
    //BullMQ need
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times: number) {
      if (times > 20) {
        logger.error("Redis: too many reconnect attempts — giving up");
        return null;
      }
      const delay = Math.min(times * 200, 5000);
      logger.warn({ attempt: times, delayMs: delay }, "Redis reconnecting…");
      return delay;
    },
  });

  redisClient.on("connect", () => logger.info("Redis: connected"));
  redisClient.on("ready", () => logger.info("Redis: ready"));
  redisClient.on("error", (err: Error) =>
    logger.error({ err }, "Redis: client error"),
  );
  redisClient.on("close", () => logger.warn("Redis: connection closed"));
  redisClient.on("reconnecting", () => logger.info("Redis: reconnecting…"));
  redisClient.on("end", () => logger.warn("Redis: connection ended"));

  return redisClient;
}

export async function closeRedis(): Promise<void> {
  if (!redisClient) return;
  try {
    await redisClient.quit();
    logger.info("Redis: connection closed gracefully");
  } catch {
    redisClient.disconnect();
    logger.warn("Redis: forced disconnect");
  } finally {
    redisClient = null;
  }
}
