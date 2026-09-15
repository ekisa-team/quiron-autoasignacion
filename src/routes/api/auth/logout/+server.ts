import { json, type RequestHandler } from "@sveltejs/kit";

export const POST: RequestHandler = async ({ cookies }) => {
  const cookieOptions = {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: false,
  };

  cookies.delete("auth_token", cookieOptions);
  cookies.delete("refresh_token", cookieOptions);
  cookies.delete("auth_token", { path: "/" });
  cookies.delete("refresh_token", { path: "/" });

  cookies.set("auth_token", "", {
    ...cookieOptions,
    maxAge: 0,
    expires: new Date(0),
  });
  cookies.set("refresh_token", "", {
    ...cookieOptions,
    maxAge: 0,
    expires: new Date(0),
  });

  return json({ success: true, message: "Sesión cerrada correctamente" });
};
