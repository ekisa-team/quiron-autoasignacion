import { apiPost } from "$lib/server/api";
import { sendPasswordChangeNotification } from "$lib/server/email";
import { hashPassword, verifyPassword } from "$lib/server/password";
import type { RawPatientLoginApi } from "$lib/types/auth";
import { error, json, type RequestHandler } from "@sveltejs/kit";

export const POST: RequestHandler = async ({ request, locals }) => {
  const tunnelUrl = locals.tenant?.apirUrl;
  if (!tunnelUrl) {
    error(500, "Tunnel url not found");
  }

  try {
    if (!locals.user) {
      error(401, "No autenticado");
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;
    const patientId = Number(locals.user.patientId);
    const clientId = Number(locals.user.clientId) || locals.clientId;

    if (!currentPassword || !newPassword) {
      return json(
        { success: false, message: "Todos los campos son requeridos" },
        { status: 400 },
      );
    }

    if (newPassword.length < 6) {
      return json(
        {
          success: false,
          message: "La nueva contraseña debe tener mínimo 6 caracteres",
        },
        { status: 400 },
      );
    }

    const loginCheck = await apiPost<RawPatientLoginApi>(
      tunnelUrl,
      "/auth/login",
      {
        identificacion: locals.user.patientIdentification,
        codigo_tipo_documento: "CC",
        id_cliente: clientId,
      },
    );

    const user = loginCheck.data;
    if (!user || !user.PasswordHash) {
      return json(
        { success: false, message: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    const isCurrentValid = await verifyPassword(
      currentPassword,
      user.PasswordHash,
    );

    if (!isCurrentValid) {
      return json(
        { success: false, message: "La contraseña actual es incorrecta" },
        { status: 400 },
      );
    }

    const newHash = await hashPassword(newPassword);
    const result = await apiPost<{ status: string; message: string }>(
      tunnelUrl,
      "/auth/cambiar-clave",
      {
        patient_id: patientId,
        client_id: clientId,
        new_password_hash: newHash,
      },
    );

    if (!result.ok) {
      error(500, "Error al cambiar la contraseña");
    }

    if (locals.user.email) {
      sendPasswordChangeNotification({
        clientId,
        email: locals.user.email,
        tunnelUrl,
        tenant: locals.tenant,
      }).catch(() => {});
    }

    return json({ success: true, message: "Contraseña cambiada exitosamente" });
  } catch (err) {
    error(500, JSON.stringify(err));
  }
};
