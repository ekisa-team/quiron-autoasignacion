import { dev } from "$app/environment";
import {
  generateAccessToken,
  generateRefreshToken,
  validateToken,
} from "$lib/server/jwt";
import { logger } from "$lib/server/logger";
import { resolveTenant } from "$lib/server/tenant";
import {
  error,
  type Handle,
  type HandleServerError,
  type RequestEvent,
} from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";

const PRODUCTION_DOMAIN = ".autoasignacion.ekisa.com.co";

const COOKIE_BASE_OPTIONS = {
  path: "/",
  httpOnly: true,
  sameSite: "lax" as const,
  secure: false,
};

function getTenantIdentifier(event: RequestEvent): string | null {
  // Explicit header passed by Caddy
  const headerTenant = event.request.headers.get("x-tenant");
  if (headerTenant) {
    return headerTenant;
  }

  const { hostname } = event.url;

  // Production Domain: clinica1.autoasignacion.ekisa.com.co
  if (hostname.endsWith(PRODUCTION_DOMAIN)) {
    return hostname.slice(0, -PRODUCTION_DOMAIN.length);
  }

  // TODO: remove when domain is ready
  // Free wildcard IP DNS: e.g. clinica1.46.224.43.171.sslip.io
  if (hostname.endsWith(".sslip.io") || hostname.endsWith(".nip.io")) {
    const parts = hostname.split(".");
    if (parts.length > 4) {
      return parts[0];
    }
  }

  // Dev query param: ?tenant=clinica1
  if (dev) {
    const queryTenant = event.url.searchParams.get("tenant");

    if (queryTenant) {
      event.cookies.set("dev_tenant", queryTenant, {
        ...COOKIE_BASE_OPTIONS,
        httpOnly: false,
        maxAge: 60 * 60 * 24,
      });
      return queryTenant;
    }

    const cookieTenant = event.cookies.get("dev_tenant");
    if (cookieTenant) {
      return cookieTenant;
    }
  }

  return null;
}

const loggingHandle: Handle = async ({ event, resolve }) => {
  const start = Date.now();
  const { method } = event.request;
  const path = event.url.pathname;

  const clientIp =
    event.request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    event.getClientAddress();

  const response = await resolve(event);

  const durationMs = Date.now() - start;
  const status = response.status;
  const tenant =
    event.locals.tenant?.tenantIdentifier ||
    getTenantIdentifier(event) ||
    "sin-tenant";
  const user = event.locals.user?.patientIdentification || "anonimo";

  const logData = {
    method,
    path,
    status,
    durationMs,
    tenant,
    clientId: event.locals.clientId ?? null,
    user,
    ip: clientIp,
  };

  if (status >= 500) {
    logger.error(logData, `[500 ERROR] ${method} ${path} (${durationMs}ms)`);
  } else if (status >= 400) {
    logger.warn(
      logData,
      `[WARN] ${method} ${path} -> ${status} (${durationMs}ms)`,
    );
  } else {
    logger.info(
      logData,
      `[HTTP] ${method} ${path} -> ${status} (${durationMs}ms)`,
    );
  }

  return response;
};

const tenantHandle: Handle = async ({ event, resolve }) => {
  const identifier = getTenantIdentifier(event);
  if (!identifier) {
    logger.warn(
      { path: event.url.pathname },
      "Identificador de organización no encontrado",
    );
    throw error(400, "Identificador de organización no encontrado.");
  }

  const tenant = await resolveTenant(identifier);
  if (!tenant) {
    logger.warn(
      { identifier, path: event.url.pathname },
      "Organización no encontrada o inactiva",
    );
    throw error(
      404,
      `Organización '${identifier}' no encontrada o no configurada`,
    );
  }

  event.locals.tenant = tenant;
  event.locals.clientId = tenant.clientId;

  return resolve(event);
};

const authHandle: Handle = async ({ event, resolve }) => {
  const authToken = event.cookies.get("auth_token");
  let user = authToken ? validateToken(authToken) : null;

  if (!user) {
    const refreshToken = event.cookies.get("refresh_token");

    if (refreshToken) {
      const refreshData = validateToken(refreshToken);

      if (refreshData) {
        const newAccessToken = generateAccessToken(refreshData);
        const newRefreshToken = generateRefreshToken(refreshData);

        event.cookies.set("auth_token", newAccessToken, {
          ...COOKIE_BASE_OPTIONS,
          maxAge: 60 * 120,
        });

        event.cookies.set("refresh_token", newRefreshToken, {
          ...COOKIE_BASE_OPTIONS,
          maxAge: 60 * 60 * 24 * 7,
        });

        user = refreshData;
      } else {
        event.cookies.delete("auth_token", { path: "/" });
        event.cookies.delete("refresh_token", { path: "/" });
      }
    }
  }

  event.locals.user = user;

  return resolve(event);
};

export const handle = sequence(loggingHandle, tenantHandle, authHandle);

export const handleError: HandleServerError = ({
  error,
  event,
  status,
  message,
}) => {
  logger.error(
    {
      error,
      status,
      path: event.url.pathname,
      tenant: event.locals.tenant?.tenantIdentifier || "desconocido",
      clientId: event.locals.clientId,
      user: event.locals.user?.patientIdentification,
    },
    `[SERVER EXCEPTION] ${message} en ${event.url.pathname}`,
  );

  return {
    message: "Error interno en el servidor",
  };
};
