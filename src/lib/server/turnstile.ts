import { env } from "$env/dynamic/private";
import { logger } from "./logger";

export async function verifyTurnstileToken(
  token: string,
  ip?: string,
): Promise<boolean> {
  const secretKey = env.TURNSTILE_SECRET_KEY;
  if (!secretKey) return true;
  if (!token) return false;

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (ip) formData.append("remoteip", ip);

    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: formData,
      },
    );

    const data = await res.json();
    return Boolean(data.success);
  } catch (error) {
    logger.error({ error }, "Error verifying turnstile token");
    return false;
  }
}
