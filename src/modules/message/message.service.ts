import { randomUUID } from "crypto";
import { SendMessageResponse } from "../whatsapp/whatsapp.interface";
import { getMessageQueue } from "./message.queue";
import { MessageJobData } from "./message.interface";
import { logger } from "../../utils/logger";

export async function enqueueMessage(
  to: string,
  message: string,
): Promise<SendMessageResponse> {
  const requestId = randomUUID();
  const queue = getMessageQueue();

  const jobData: MessageJobData = { to, message, requestId };

  const job = await queue.add("send-message", jobData, {
    jobId: requestId,
  });

  logger.info(
    { jobId: job.id, to, requestId },
    "MessageService: message enqueued",
  );

  return {
    success: true,
    jobId: job.id ?? requestId,
    message: "Message accepted and queued for delivery",
  };
}
