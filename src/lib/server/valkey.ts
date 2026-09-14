import { env } from "$env/dynamic/private";
import Redis from "ioredis";

const globalForValkey = globalThis as unknown as {
  valkey: Redis | undefined;
};

export const valkey = globalForValkey.valkey ?? new Redis(env.VALKEY_URL || "redis://localhost:6379");

if (process.env.NODE_ENV !== "production") {
  globalForValkey.valkey = valkey;
}

valkey.on("error", (err) => {
  const message = err instanceof Error ? err.message : JSON.stringify(err);
  console.error("[Valkey Error]:", message);
});
