import type { Request, Response, NextFunction } from "express";
import { whatsappService } from "./whatsapp.service";
import {
  SendMessageRequest,
  StatusResponse,
  WhatsAppStatus,
} from "./whatsapp.interface";
import { ServiceUnavailableError } from "../../utils/errors";
import { enqueueMessage } from "../message/message.service";

// ─── GET /api/v1/whatsapp/status

export async function getStatus(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const status = whatsappService.getStatus();
    const qr = whatsappService.getCurrentQR();

    const body: StatusResponse = {
      status,
      timestamp: new Date().toISOString(),
      ...(qr !== null && { qr }),
    };

    res.status(200).json({ success: true, data: body });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/v1/whatsapp/send-message

export async function sendMessage(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { to, message } = req.body as SendMessageRequest;

    const numberArray = to.split("@");

    // Guard — reject if WhatsApp is not in READY state
    const currentStatus = whatsappService.getStatus();
    if (currentStatus !== WhatsAppStatus.READY) {
      throw new ServiceUnavailableError(
        `WhatsApp client is not ready (status: ${currentStatus}). ` +
          "Please authenticate by scanning the QR code first.",
      );
    }

    const result = await enqueueMessage(to, message);

    // 202 Accepted — the message is queued, not yet delivered
    res.status(202).json(result);
  } catch (err) {
    next(err);
  }
}
