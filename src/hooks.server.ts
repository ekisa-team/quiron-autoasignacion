import {
  generateAccessToken,
  generateRefreshToken,
  validateToken,
} from "$lib/server/jwt";
import { redirect, type Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
  const url = event.url;

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

  let clientId = 67;

  if (user && user.clientId) {
    clientId = Number(user.clientId);
  } else {
    const queryClientId =
      url.searchParams.get("c") ||
      url.searchParams.get("IdCliente") ||
      url.searchParams.get("idCliente");

    if (queryClientId && !isNaN(Number(queryClientId))) {
      clientId = Number(queryClientId);
    } else {
      const cookieTenant = event.cookies.get("client_id");
      if (cookieTenant && !isNaN(Number(cookieTenant))) {
        clientId = Number(cookieTenant);
      }
    }
  }

  event.cookies.set("client_id", clientId.toString(), {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });

  event.locals.clientId = clientId;

  const pathname = url.pathname;
  const isApiRoute = pathname.startsWith("/api");
  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/verify-email") ||
    pathname.startsWith("/register-confirmation") ||
    pathname.startsWith("/forgot-password-confirmation");

  if (
    user &&
    isAuthRoute &&
    !pathname.startsWith("/verify-email") &&
    !pathname.startsWith("/reset-password")
  ) {
    throw redirect(303, "/");
  }

  if (!user && !isAuthRoute && !isApiRoute) {
    throw redirect(303, `/login?c=${clientId}`);
  }

  return resolve(event);
};
