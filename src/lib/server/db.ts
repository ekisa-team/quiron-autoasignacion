import { env } from "$env/dynamic/private";
import mssql from "mssql";

const tenantPools = new Map<number, mssql.ConnectionPool>();
let masterPool: mssql.ConnectionPool | null = null;

function parseAdoNetConnectionString(connStr: string): mssql.config {
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

export async function getMasterDb(): Promise<mssql.ConnectionPool> {
  if (masterPool && masterPool.connected) {
    return masterPool;
  }

  const masterConnString = env.DATABASE_MASTER_URL || env.DATABASE_URL;
  if (!masterConnString) {
    throw new Error(
      "DATABASE_MASTER_URL no está configurada en las variables de entorno (.env).",
    );
  }

  const config = parseAdoNetConnectionString(masterConnString);
  masterPool = await new mssql.ConnectionPool(config).connect();
  return masterPool;
}

export async function getTenantDb(
  clientId: number = 67,
): Promise<mssql.ConnectionPool> {
  const existingPool = tenantPools.get(clientId);
  if (existingPool && existingPool.connected) {
    return existingPool;
  }

  const master = await getMasterDb();
  const request = master.request();
  request.input("clientId", mssql.Int, clientId);

  const result = await request.query<{ BaseDatos: string }>(`
		SELECT BaseDatos 
		FROM dbo.Clientes 
		WHERE IdCliente = @clientId
	`);

  const clientConnString = result.recordset[0]?.BaseDatos;
  if (!clientConnString) {
    throw new Error(
      `No se encontró configuración de base de datos para el cliente con ID: ${clientId}`,
    );
  }

  const tenantConfig = parseAdoNetConnectionString(clientConnString);
  const newPool = await new mssql.ConnectionPool(tenantConfig).connect();

  newPool.on("error", (err) => {
    console.error(`[SQL Error] Error en Pool del Cliente ${clientId}:`, err);
    tenantPools.delete(clientId);
  });

  tenantPools.set(clientId, newPool);
  return newPool;
}

export async function executeProcedure<T = any>(
  clientId: number,
  procedureName: string,
  params: Record<
    string,
    { type: mssql.ISqlType | (() => mssql.ISqlType); value: any }
  >,
): Promise<T[]> {
  const pool = await getTenantDb(clientId);
  const request = pool.request();

  for (const [key, { type, value }] of Object.entries(params)) {
    request.input(key, type, value);
  }

  const result = await request.execute<T>(procedureName);
  return result.recordset || [];
}

export async function executeQuery<T = any>(
  clientId: number,
  query: string,
  params?: Record<
    string,
    { type: mssql.ISqlType | (() => mssql.ISqlType); value: any }
  >,
): Promise<T[]> {
  const pool = await getTenantDb(clientId);
  const request = pool.request();

  if (params) {
    for (const [key, { type, value }] of Object.entries(params)) {
      request.input(key, type, value);
    }
  }

  const result = await request.query<T>(query);
  return result.recordset || [];
}
