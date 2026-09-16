import type { TenantConfig } from "$lib/types/tenant";
import mssql from "mssql";
import { logger } from "./logger";
import { getMasterPool } from "./master-db";
import { valkey } from "./valkey";

const CACHE_PREFIX = "tenant:config:";
const TTL = 3600;

async function fetchTenantFromDatabase(
  identifier: string,
): Promise<TenantConfig | null> {
  try {
    const pool = await getMasterPool();
    if (!pool) return null;

    const req = pool.request();
    req.input("identifier", mssql.VarChar(50), identifier);

    const result = await req.query<{
      IdCliente: number;
      TenantIdentifier: string;
      AutoassignmentConfig?: string;
      NombreEkisa?: string;
    }>(`
      SELECT TOP 1 IdCliente, TenantIdentifier, AutoassignmentConfig, NombreEkisa
      FROM dbo.Clientes
      WHERE TenantIdentifier = @identifier AND (Estado = 'Activo' OR Estado IS NULL)
    `);

    const row = result.recordset[0];
    if (!row) return null;

    if (row.AutoassignmentConfig) {
      try {
        const parsed = JSON.parse(row.AutoassignmentConfig) as TenantConfig;
        return {
          ...parsed,
          clientId: parsed.clientId ?? row.IdCliente,
          tenantIdentifier: row.TenantIdentifier,
        };
      } catch {
        return row as unknown as TenantConfig;
      }
    }

    return {
      tenantIdentifier: row.TenantIdentifier,
      clientId: row.IdCliente,
      name: row.NombreEkisa || "Quirón Autoasignación",
      logoUrl: "/icons/LogoQuiron.png",
      esquemaUrl: "http://localhost:8080/api/v1",
    };
  } catch (error) {
    logger.error({ identifier, error }, "Error fetching tenant from database");
    return null;
  }
}

export async function resolveTenant(
  identifier: string,
): Promise<TenantConfig | null> {
  const normalizedId = identifier.trim().toLowerCase();
  const cacheKey = `${CACHE_PREFIX}${normalizedId}`;

  try {
    const cached = await valkey.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as TenantConfig;
    }
  } catch (error) {
    logger.error(
      { identifier, cacheKey, error },
      "Error fetching tenant from cache",
    );
  }

  const tenant = await fetchTenantFromDatabase(normalizedId);

  if (!tenant) {
    return null;
  }

  try {
    await valkey.setex(cacheKey, TTL, JSON.stringify(tenant));
  } catch (error) {
    logger.error({ identifier, cacheKey, error }, "Error caching tenant");
  }

  return tenant;
}

export async function invalidateTenantCache(identifier: string): Promise<void> {
  const normalizedId = identifier.trim().toLowerCase();
  try {
    await valkey.del(`${CACHE_PREFIX}${normalizedId}`);
  } catch (err) {
    logger.error({ identifier, error: err }, "Error invalidating tenant cache");
  }
}
