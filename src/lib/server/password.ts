import argon2 from "argon2";
import crypto from "node:crypto";
import { logger } from "./logger";

const DEGREE_OF_PARALLELISM = 4;
const ITERATIONS = 5;
const MEMORY_SIZE_KB = 64 * 1024;
const HASH_SIZE = 32;
const SALT_SIZE = 16;

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(SALT_SIZE);

  const rawHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: MEMORY_SIZE_KB,
    timeCost: ITERATIONS,
    parallelism: DEGREE_OF_PARALLELISM,
    salt,
    raw: true,
    hashLength: HASH_SIZE,
  });

  return `${salt.toString("base64")}:${rawHash.toString("base64")}`;
}

export async function verifyPassword(
  password: string,
  storedHashFormatted: string,
): Promise<boolean> {
  try {
    const parts = storedHashFormatted.split(":");
    if (parts.length !== 2) return false;

    const salt = Buffer.from(parts[0], "base64");
    const storedHash = Buffer.from(parts[1], "base64");

    const computedHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: MEMORY_SIZE_KB,
      timeCost: ITERATIONS,
      parallelism: DEGREE_OF_PARALLELISM,
      salt,
      raw: true,
      hashLength: HASH_SIZE,
    });

    return crypto.timingSafeEqual(computedHash, storedHash);
  } catch (error) {
    logger.error({ error }, "Error trying to verify password");
    return false;
  }
}

export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}
