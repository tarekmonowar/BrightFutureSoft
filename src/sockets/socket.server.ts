import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import { config } from "../config";
import { logger } from "../utils/logger";
import { SOCKET_EVENTS } from "./events";
import { whatsappService } from "../modules/whatsapp/whatsapp.service";

let io: Server | null = null;

export function createSocketServer(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: config.NODE_ENV === "production" ? false : "*",
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
    pingInterval: 25_000,
    pingTimeout: 60_000,
  });

  io.on("connection", (socket) => {
    const ip = socket.handshake.address;
    logger.info({ socketId: socket.id, ip }, "Socket: client connected");

    const status = whatsappService.getStatus();
    const qr = whatsappService.getCurrentQR();

    // ── Immediately sync current WhatsApp state to the new client
    socket.emit(SOCKET_EVENTS.STATUS, { status });

    if (status === "READY") {
      socket.emit(SOCKET_EVENTS.READY);
    } else if (qr) {
      socket.emit(SOCKET_EVENTS.QR, { qr });
    }

    socket.on("disconnect", (reason: string) => {
      logger.info(
        { socketId: socket.id, reason },
        "Socket: client disconnected",
      );
    });

    socket.on("error", (err: Error) => {
      logger.error({ socketId: socket.id, err }, "Socket: client error");
    });
  });

  // ── WhatsApp event listeners
  whatsappService.on("qr", (payload: { qr: string }) => {
    io!.emit(SOCKET_EVENTS.QR, payload);
    logger.debug("Socket: broadcasted QR event");
  });

  whatsappService.on("ready", () => {
    io!.emit(SOCKET_EVENTS.READY);
    logger.debug("Socket: broadcasted ready event");
  });

  whatsappService.on("authenticated", () => {
    io!.emit(SOCKET_EVENTS.AUTHENTICATED);
    logger.debug("Socket: broadcasted authenticated event");
  });

  whatsappService.on("disconnected", (payload: { reason: string }) => {
    io!.emit(SOCKET_EVENTS.DISCONNECTED, payload);
    logger.debug("Socket: broadcasted disconnected event");
  });

  whatsappService.on(
    "loading",
    (payload: { percent: number; message: string }) => {
      io!.emit(SOCKET_EVENTS.LOADING, payload);
    },
  );

  whatsappService.on("auth_failure", (payload: { message: string }) => {
    io!.emit(SOCKET_EVENTS.AUTH_FAILURE, payload);
    logger.debug("Socket: broadcasted auth_failure event");
  });

  logger.info("Socket: Socket.IO server initialized");
  return io;
}

export function getSocketServer(): Server | null {
  return io;
}
