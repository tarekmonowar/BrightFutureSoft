import { Queue } from "bullmq";
import { MessageJobData } from "./message.interface";
import { getRedisClient } from "../../config/redis";
import { logger } from "../../utils/logger";

// ─── Queue setup

export const MESSAGES_QUEUE = "whatsapp:messages";

let messageQueue: Queue<MessageJobData> | null = null;

export function getMessageQueue(): Queue<MessageJobData> {
  if (messageQueue) return messageQueue;

  messageQueue = new Queue<MessageJobData>(MESSAGES_QUEUE, {
    connection: getRedisClient(),
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2_000,
      },
      removeOnComplete: { count: 100, age: 24 * 3_600 },
      removeOnFail: { count: 500, age: 7 * 24 * 3_600 },
    },
  });

  messageQueue.on("error", (err: Error) => {
    logger.error({ err }, "MessageQueue: error");
  });

  logger.info({ queue: MESSAGES_QUEUE }, "MessageQueue: initialized");
  return messageQueue;
}

export async function closeMessageQueue(): Promise<void> {
  if (!messageQueue) return;
  await messageQueue.close();
  messageQueue = null;
  logger.info("MessageQueue: closed");
}
