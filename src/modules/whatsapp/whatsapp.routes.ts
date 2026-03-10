import { Router } from "express";
import { apiKeyAuth } from "../../middleware/auth.middleware";
import { sendMessageRateLimiter } from "../../middleware/rateLimiter";
import { validateBody } from "../../middleware/validate";
import { getStatus, sendMessage } from "./whatsapp.controller";
import { sendMessageSchema } from "./whatsapp.validation";

// ─── Router ──
const router = Router();

// GET /api/v1/whatsapp/status
router.get("/status", getStatus);

// POST /api/v1/whatsapp/send-message
router.post(
  "/send-message",
  apiKeyAuth,
  sendMessageRateLimiter,
  validateBody(sendMessageSchema),
  sendMessage,
);

export default router;
