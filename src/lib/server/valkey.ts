import { env } from "$env/dynamic/private";
import Redis from "ioredis";
import { logger } from "./logger";

const globalForValkey = globalThis as unknown as {
  valkey: Redis | undefined;
};

export const valkey =
  globalForValkey.valkey ??
  new Redis(env.VALKEY_URL || "redis://localhost:6379");

if (process.env.NODE_ENV !== "production") {
  globalForValkey.valkey = valkey;
}

valkey.on("error", (error) => {
  logger.error({ error }, "Error connecting to redis");
});
