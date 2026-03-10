import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

// ─── Environment schema

const envSchema = z.object({
  PORT: z
    .string()
    .default("3000")
    .transform(Number)
    .refine((n) => n > 0 && n < 65536, "PORT must be a valid TCP port"),

  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  REDIS_URL: z.string().url("REDIS_URL must be a valid URL"),

  API_KEY: z.string().min(8, "API_KEY must be at least 8 characters"),

  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),

  RATE_LIMIT_WINDOW_MS: z
    .string()
    .default("900000")
    .transform(Number)
    .refine((n) => n > 0, "RATE_LIMIT_WINDOW_MS must be positive"),

  RATE_LIMIT_MAX: z
    .string()
    .default("100")
    .transform(Number)
    .refine((n) => n > 0, "RATE_LIMIT_MAX must be positive"),

  WHATSAPP_CLIENT_ID: z.string().min(1).default("whatsapp-client"),

  MESSAGE_QUEUE_CONCURRENCY: z
    .string()
    .default("5")
    .transform(Number)
    .refine((n) => n > 0 && n <= 50, "Concurrency must be between 1 and 50"),
});

// ─── Validate at startup

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("\n❌  Invalid environment configuration:\n");
  parsed.error.errors.forEach((e) => {
    console.error(`   ${e.path.join(".")} — ${e.message}`);
  });
  console.error(
    "\n   Copy .env.example → .env and fill in all required values.\n",
  );
  process.exit(1);
}

export const config = parsed.data;

export type Config = typeof config;
