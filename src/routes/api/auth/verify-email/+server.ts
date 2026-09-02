import { apiPost } from "$lib/server/api";
import { json, type RequestHandler } from "@sveltejs/kit";

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const { token, clientId } = await request.json();
    const activeClientId = Number(clientId) || locals.clientId || 67;

    if (!token) {
      return json(
        { success: false, message: "Token requerido" },
        { status: 400 },
      );
    }

    const result = await apiPost("/auth/verificar-email", {
      token: String(token).trim(),
      client_id: activeClientId,
    });

    if (!result.ok) {
      return json(
        {
          success: false,
          message: "Enlace de verificación inválido o expirado",
        },
        { status: 400 },
      );
    }

    return json({ success: true, message: "Correo verificado exitosamente" });
  } catch (error) {
    return json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 },
    );
  }
};
