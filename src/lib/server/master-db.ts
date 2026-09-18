import { env } from "$env/dynamic/private";
import mssql from "mssql";
import { logger } from "./logger";

let masterPool: mssql.ConnectionPool | null = null;

export async function getMasterPool(): Promise<mssql.ConnectionPool | null> {
  const connStr = env.DATABASE_MASTER_URL || env.DATABASE_URL;
  if (!connStr) return null;

  if (masterPool?.connected) {
    return masterPool;
  }

  try {
    const config = mssql.ConnectionPool.parseConnectionString(connStr);
    masterPool = await new mssql.ConnectionPool(config).connect();
    return masterPool;
  } catch (error) {
    logger.error({ error }, "Failed to connect to master database");
    return null;
  }
}
