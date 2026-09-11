import { apiPost } from "$lib/server/api";
import { error, json, type RequestHandler } from "@sveltejs/kit";

export const POST: RequestHandler = async ({ request, locals }) => {
  const tunnelUrl = locals.tenant?.hclapiUrl;
  if (!tunnelUrl) {
    error(500, "Tunnel url not found");
  }

  try {
    const { token, clientId } = await request.json();
    const activeClientId = Number(clientId) || locals.clientId;

    if (!token) {
      return json(
        { success: false, message: "Token requerido" },
        { status: 400 },
      );
    }

    const result = await apiPost(tunnelUrl, "/auth/verificar-email", {
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
  } catch (err) {
    error(500, JSON.stringify(err));
  }
};
