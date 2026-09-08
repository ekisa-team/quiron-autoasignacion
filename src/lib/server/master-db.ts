import { env } from "$env/dynamic/private";
import mssql from "mssql";

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
    console.error("[Master DB Connection Error]:", error);
    return null;
  }
}
