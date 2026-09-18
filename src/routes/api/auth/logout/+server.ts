import { json, type RequestHandler } from "@sveltejs/kit";

export const POST: RequestHandler = async ({ cookies }) => {
  cookies.delete("auth_token", { path: "/" });
  cookies.delete("refresh_token", { path: "/" });

  return json({ success: true, message: "Sesión cerrada correctamente" });
};
