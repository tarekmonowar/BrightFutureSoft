import pino from "pino";
import { config } from "../config";

const isDevelopment = config.NODE_ENV !== "production";

export const logger = pino({
  level: config.LOG_LEVEL,

  // Human-friendly output in dev, pure JSON in production
  ...(isDevelopment && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss.l",
        ignore: "pid,hostname",
        singleLine: false,
      },
    },
  }),

  base: {
    env: config.NODE_ENV,
  },

  timestamp: pino.stdTimeFunctions.isoTime,

  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
});
