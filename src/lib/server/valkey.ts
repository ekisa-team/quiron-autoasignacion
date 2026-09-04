import { env } from "$env/dynamic/private";
import Redis from "ioredis";

const globalForValkey = globalThis as unknown as {
  valkey: Redis | undefined;
};

const connectionString = (env.VALKEY_URL || "redis://localhost:6379").replace(
  "valkey://",
  "redis://",
);

export const valkey = globalForValkey.valkey ?? new Redis(connectionString);

if (process.env.NODE_ENV !== "production") {
  globalForValkey.valkey = valkey;
}

valkey.on("error", (err) => {
  console.error("[Valkey Error]:", err.message);
});
