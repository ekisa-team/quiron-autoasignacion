import { dev } from "$app/environment";
import {
  generateAccessToken,
  generateRefreshToken,
  validateToken,
} from "$lib/server/jwt";
import { resolveTenant } from "$lib/server/tenant";
import { error, type Handle, type RequestEvent } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";

const PRODUCTION_DOMAIN = ".autoasignacion.ekisa.com.co";
const DEFAULT_TENANT = "";

const COOKIE_BASE_OPTIONS = {
  path: "/",
  httpOnly: true,
  sameSite: "lax" as const,
  secure: !dev,
};

function getTenantIdentifier(event: RequestEvent): string {
  const { hostname } = event.url;

  if (hostname.endsWith(PRODUCTION_DOMAIN)) {
    return hostname.slice(0, -PRODUCTION_DOMAIN.length);
  }

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

  return DEFAULT_TENANT;
}

const tenantHandle: Handle = async ({ event, resolve }) => {
  const identifier = getTenantIdentifier(event);
  const tenant = await resolveTenant(identifier);

  if (!tenant) {
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

export const handle = sequence(tenantHandle, authHandle);
