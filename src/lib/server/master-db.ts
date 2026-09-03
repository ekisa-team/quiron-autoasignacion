import { env } from "$env/dynamic/private";
import mssql from "mssql";

let masterPool: mssql.ConnectionPool | null = null;

function parseConnectionString(connStr: string): mssql.config {
  const config: mssql.config = {
    server: "localhost",
    options: {
      encrypt: true,
      trustServerCertificate: false,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };

  const parts = connStr.split(";").filter((p) => p.trim() !== "");

  for (const part of parts) {
    const [keyRaw, ...valueParts] = part.split("=");
    const key = keyRaw?.trim().toLowerCase();
    const value = valueParts.join("=").trim();

    if (!key || !value) continue;

    switch (key) {
      case "data source":
      case "server":
        if (value.includes(",")) {
          const [srv, port] = value.split(",");
          config.server = srv.trim();
          config.port = Number(port.trim()) || 1433;
        } else {
          config.server = value;
        }
        break;
      case "initial catalog":
      case "database":
        config.database = value;
        break;
      case "user id":
      case "user":
      case "uid":
        config.user = value;
        break;
      case "password":
      case "pwd":
        config.password = value;
        break;
      case "encrypt":
        config.options = {
          ...config.options,
          encrypt: value.toLowerCase() === "true",
        };
        break;
      case "trustservercertificate":
        config.options = {
          ...config.options,
          trustServerCertificate: value.toLowerCase() === "true",
        };
        break;
    }
  }

  return config;
}

export async function getMasterPool(): Promise<mssql.ConnectionPool | null> {
  const connStr = env.DATABASE_MASTER_URL || env.DATABASE_URL;
  if (!connStr) return null;

  if (masterPool && masterPool.connected) {
    return masterPool;
  }

  try {
    const config = parseConnectionString(connStr);
    masterPool = await new mssql.ConnectionPool(config).connect();
    return masterPool;
  } catch (error) {
    console.error("[Master DB Connection Error]:", error);
    return null;
  }
}
