import { dev } from "$app/environment";
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || (dev ? "debug" : "info"),
  transport: dev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined,
});
