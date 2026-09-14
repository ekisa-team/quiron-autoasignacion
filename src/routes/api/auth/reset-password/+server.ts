import { apiPost } from "$lib/server/api";
import { sendPasswordChangeNotification } from "$lib/server/email";
import { hashPassword } from "$lib/server/password";
import { error, json, type RequestHandler } from "@sveltejs/kit";

interface ResetPasswordApiResponse {
  email?: string;
}

export const POST: RequestHandler = async ({ request, locals }) => {
  const tunnelUrl = locals.tenant?.apirUrl;
  if (!tunnelUrl) {
    error(500, "Tunnel url not found");
  }

  try {
    const body = await request.json();
    const { token, newPassword, clientId } = body;
    const activeClientId = Number(clientId) || locals.clientId;

    if (!token || !newPassword) {
      return json(
        { success: false, message: "Token y nueva contraseña requeridos" },
        { status: 400 },
      );
    }

    if (String(newPassword).length < 6) {
      return json(
        {
          success: false,
          message: "La contraseña debe tener mínimo 6 caracteres",
        },
        { status: 400 },
      );
    }

    const newHash = await hashPassword(newPassword);
    const result = await apiPost<ResetPasswordApiResponse>(
      tunnelUrl,
      "/auth/restablecer-clave",
      {
        token: String(token).trim(),
        new_password_hash: newHash,
        client_id: activeClientId,
      },
    );

    if (!result.ok) {
      return json(
        {
          success: false,
          message: "El enlace de recuperación es inválido o ha expirado",
        },
        { status: 400 },
      );
    }

    if (result.data?.email) {
      sendPasswordChangeNotification({
        clientId: activeClientId,
        email: result.data.email,
        tunnelUrl,
        tenant: locals.tenant,
      }).catch(() => {});
    }

    return json({
      success: true,
      message: "Contraseña restablecida con éxito. Ya puedes iniciar sesión.",
    });
  } catch (err) {
    error(500, JSON.stringify(err));
  }
};
