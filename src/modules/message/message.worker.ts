import { Worker, type Job } from "bullmq";
import { config } from "../../config";
import { MESSAGES_QUEUE } from "./message.queue";
import { MessageJobData } from "./message.interface";
import { logger } from "../../utils/logger";
import { whatsappService } from "../whatsapp/whatsapp.service";
import { getRedisClient } from "../../config/redis";

// ─── BullMQ worker setup

let worker: Worker<MessageJobData> | null = null;

export function startMessageWorker(): Worker<MessageJobData> {
  if (worker) return worker;

  worker = new Worker<MessageJobData>(
    MESSAGES_QUEUE,
    async (job: Job<MessageJobData>) => {
      const { to, message, requestId } = job.data;

      logger.info(
        { jobId: job.id, to, requestId, attempt: job.attemptsMade + 1 },
        "Worker: processing message job",
      );

      await whatsappService.sendMessage(to, message);

      logger.info(
        { jobId: job.id, to, requestId },
        "Worker: message job completed",
      );
    },
    {
      connection: getRedisClient(),
      concurrency: config.MESSAGE_QUEUE_CONCURRENCY,
      limiter: {
        max: 10,
        duration: 1_000,
      },
    },
  );

  worker.on("completed", (job: Job<MessageJobData>) => {
    logger.info({ jobId: job.id }, "Worker: job completed");
  });

  worker.on("failed", (job: Job<MessageJobData> | undefined, err: Error) => {
    logger.error(
      { jobId: job?.id, err: err.message, stack: err.stack },
      "Worker: job failed",
    );
  });

  worker.on("error", (err: Error) => {
    logger.error({ err }, "Worker: worker-level error");
  });

  worker.on("stalled", (jobId: string) => {
    logger.warn({ jobId }, "Worker: job stalled");
  });

  logger.info(
    { queue: MESSAGES_QUEUE, concurrency: config.MESSAGE_QUEUE_CONCURRENCY },
    "Worker: started",
  );

  return worker;
}

export async function stopMessageWorker(): Promise<void> {
  if (!worker) return;
  await worker.close();
  worker = null;
  logger.info("Worker: stopped");
}
