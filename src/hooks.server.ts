import {
  generateAccessToken,
  generateRefreshToken,
  validateToken,
} from "$lib/server/jwt";
import { resolveTenant } from "$lib/server/tenant";
import { tenantContext } from "$lib/server/tenant-context";
import { error, type Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";

const tenantHandle: Handle = async ({ event, resolve }) => {
  const host = event.request.headers.get("host") || "";
  let identifier = "escanografia";

  if (host.includes(".autoasignacion.ekisa.com.co")) {
    identifier = host.split(".")[0];
  } else {
    const queryTenant =
      event.url.searchParams.get("tenant") || event.url.searchParams.get("t");
    if (queryTenant) {
      identifier = queryTenant;
      event.cookies.set("dev_tenant", identifier, {
        path: "/",
        httpOnly: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
      });
    } else {
      const cookieTenant = event.cookies.get("dev_tenant");
      if (cookieTenant) {
        identifier = cookieTenant;
      }
    }
  }

  const tenant = await resolveTenant(identifier);

  if (!tenant) {
    throw error(
      404,
      `Organización '${identifier}' no encontrada o no configurada`,
    );
  }

  event.locals.tenant = tenant;
  event.locals.clientId = tenant.clientId;

  return tenantContext.run(
    {
      hclapiUrl: tenant.hclapiUrl,
      clientId: tenant.clientId,
      tenantIdentifier: tenant.tenantIdentifier,
    },
    () => resolve(event),
  );
};

const authHandle: Handle = async ({ event, resolve }) => {
  const authToken = event.cookies.get("auth_token");
  const refreshToken = event.cookies.get("refresh_token");
  let user = authToken ? validateToken(authToken) : null;

  if (!user && refreshToken) {
    const refreshData = validateToken(refreshToken);
    if (refreshData) {
      const newAccessToken = generateAccessToken(refreshData);
      const newRefreshToken = generateRefreshToken(refreshData);
      event.cookies.set("auth_token", newAccessToken, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 120,
      });
      event.cookies.set("refresh_token", newRefreshToken, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7,
      });
      user = refreshData;
    }
  }

  event.locals.user = user;

  return resolve(event);
};

export const handle = sequence(tenantHandle, authHandle);
