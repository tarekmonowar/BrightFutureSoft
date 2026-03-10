import { EventEmitter } from "events";
import { Client, LocalAuth } from "whatsapp-web.js";
import QRCode from "qrcode";
import { WhatsAppStatus } from "./whatsapp.interface";
import { logger } from "../../utils/logger";
import { config } from "../../config";

const WWEBJS_DATA_PATH = "./.wwebjs_auth";
const BASE_RECONNECT_DELAY_MS = 2_000;
const MAX_RECONNECT_ATTEMPTS = 10;

const PUPPETEER_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-accelerated-2d-canvas",
  "--no-first-run",
  "--no-zygote",
  "--disable-gpu",
  "--disable-extensions",
];

// ─── WhatsApp service (singleton EventEmitter)

class WhatsAppService extends EventEmitter {
  private static _instance: WhatsAppService;
  private client: Client | null = null;
  private status: WhatsAppStatus = WhatsAppStatus.INITIALIZING;
  private currentQR: string | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;

  private constructor() {
    super();
    this.setMaxListeners(20);
  }

  static getInstance(): WhatsAppService {
    if (!WhatsAppService._instance) {
      WhatsAppService._instance = new WhatsAppService();
    }
    return WhatsAppService._instance;
  }

  // ── Public getters

  getStatus(): WhatsAppStatus {
    return this.status;
  }

  getCurrentQR(): string | null {
    return this.currentQR;
  }

  isReady(): boolean {
    return this.status === WhatsAppStatus.READY;
  }

  // ── Lifecycle

  async initialize(): Promise<void> {
    if (this.destroyed) {
      logger.warn("WhatsAppService: already destroyed — cannot re-initialize");
      return;
    }

    logger.info("WhatsAppService: initializing client…");
    this.setStatus(WhatsAppStatus.INITIALIZING);

    // On every restart the same directory is reused → no new QR required.
    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: config.WHATSAPP_CLIENT_ID,
        dataPath: WWEBJS_DATA_PATH,
      }),
      puppeteer: {
        headless: true,
        args: PUPPETEER_ARGS,
      },
    });

    this.attachClientEvents();

    try {
      await this.client.initialize();
    } catch (err) {
      logger.error({ err }, "WhatsAppService: client.initialize() threw");
      this.setStatus(WhatsAppStatus.FAILED);
      this.scheduleReconnect();
    }
  }

  async destroy(): Promise<void> {
    this.destroyed = true;
    this.clearReconnectTimer();

    if (this.client) {
      try {
        await this.client.destroy();
      } catch (err) {
        logger.warn({ err }, "WhatsAppService: error during client.destroy()");
      }
      this.client = null;
    }

    logger.info("WhatsAppService: destroyed");
  }

  // ── Messaging

  async sendMessage(to: string, text: string): Promise<void> {
    if (!this.isReady() || !this.client) {
      throw new Error(
        `WhatsApp client is not ready (status: ${this.status}). ` +
          "Please wait for authentication to complete.",
      );
    }

    // Normalise to WhatsApp chat ID format
    const chatId = to.includes("@") ? to : `${to}@c.us`;

    logger.info({ to: chatId }, "WhatsAppService: sending message");
    await this.client.sendMessage(chatId, text);
    logger.info({ to: chatId }, "WhatsAppService: message sent");
  }

  private setStatus(status: WhatsAppStatus): void {
    this.status = status;
    logger.debug({ status }, "WhatsAppService: status changed");
  }

  private attachClientEvents(): void {
    if (!this.client) return;

    // QR code — convert to scannable base-64 data URL
    this.client.on("qr", async (rawQr: string) => {
      try {
        const dataUrl = await QRCode.toDataURL(rawQr);
        this.currentQR = dataUrl;
        this.setStatus(WhatsAppStatus.QR_READY);
        this.emit("qr", { qr: dataUrl });
        logger.info("WhatsAppService: QR code generated — awaiting scan");
      } catch (err) {
        logger.error({ err }, "WhatsAppService: QR generation failed");
      }
    });

    // Credentials validated
    this.client.on("authenticated", () => {
      logger.info("WhatsAppService: authenticated");
      this.currentQR = null;
      this.setStatus(WhatsAppStatus.AUTHENTICATED);
      this.emit("authenticated");
    });

    // Auth rejected — generate a fresh QR
    this.client.on("auth_failure", async (msg: string) => {
      logger.error({ msg }, "WhatsAppService: auth_failure");
      this.setStatus(WhatsAppStatus.FAILED);
      this.emit("auth_failure", { message: msg });

      try {
        await this.reinitialize();
      } catch (err) {
        logger.error(
          { err },
          "WhatsAppService: failed to reinitialize after auth_failure",
        );
        this.scheduleReconnect();
      }
    });

    // Client Ready
    this.client.on("ready", () => {
      logger.info("WhatsAppService: client ready ✓");
      this.reconnectAttempts = 0;
      this.currentQR = null;
      this.setStatus(WhatsAppStatus.READY);
      this.emit("ready");
    });

    //WhatsApp Web loading progress
    this.client.on("loading_screen", (percent: number, message: string) => {
      logger.debug({ percent, message }, "WhatsAppService: loading");
      this.emit("loading", { percent, message });
    });

    // Client disconnected
    this.client.on("disconnected", async (reason: string) => {
      logger.warn({ reason }, "WhatsAppService: disconnected");

      this.setStatus(WhatsAppStatus.DISCONNECTED);
      this.currentQR = null;
      this.emit("disconnected", { reason });

      // "LOGOUT" = user intentionally logged out, than reinitializing prompts WhatsApp to show a fresh QR
      if (reason === "LOGOUT") {
        logger.info(
          "WhatsAppService: logout detected — re-initializing for new QR",
        );
        await this.reinitialize();
      } else {
        this.scheduleReconnect();
      }
    });
  }

  // ── Reconnection

  private scheduleReconnect(): void {
    if (this.destroyed) return;

    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      logger.error(
        { maxAttempts: MAX_RECONNECT_ATTEMPTS },
        "WhatsAppService: max reconnect attempts reached — giving up",
      );
      this.setStatus(WhatsAppStatus.FAILED);
      return;
    }

    this.clearReconnectTimer();

    this.reconnectAttempts += 1;
    const delay = BASE_RECONNECT_DELAY_MS * Math.min(this.reconnectAttempts, 5);

    logger.info(
      { attempt: this.reconnectAttempts, delayMs: delay },
      "WhatsAppService: scheduling reconnect",
    );

    this.setStatus(WhatsAppStatus.RECONNECTING);

    this.reconnectTimer = setTimeout(() => {
      this.reinitialize().catch((err) => {
        logger.error({ err }, "WhatsAppService: error during reinitialize");
      });
    }, delay);
  }

  private async reinitialize(): Promise<void> {
    logger.info(
      { attempt: this.reconnectAttempts },
      "WhatsAppService: reinitializing…",
    );

    if (this.client) {
      this.client.removeAllListeners();
      try {
        await this.client.destroy();
      } catch (err) {
        logger.warn({ err }, "WhatsAppService: error destroying old client");
      }
      this.client = null;
    }

    await this.initialize();
    if (this.currentQR) {
      this.emit("qr", { qr: this.currentQR });
      this.setStatus(WhatsAppStatus.QR_READY);
    }
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

// ─── Export singleton

export const whatsappService = WhatsAppService.getInstance();
