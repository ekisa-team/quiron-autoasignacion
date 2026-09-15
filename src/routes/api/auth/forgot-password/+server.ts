import { apiPost } from "$lib/server/api";
import { sendPasswordResetEmail } from "$lib/server/email";
import { generateSecureToken } from "$lib/server/password";
import { verifyTurnstileToken } from "$lib/server/turnstile";
import { error, json, type RequestHandler } from "@sveltejs/kit";

interface PasswordResetApiResponse {
  patient_id?: number;
  email?: string;
  identification?: string;
}

export const POST: RequestHandler = async ({
  request,
  locals,
  getClientAddress,
  url,
}) => {
  const tunnelUrl = locals.tenant?.esquemaUrl;
  if (!tunnelUrl) {
    error(500, "Tunnel url not found");
  }

  try {
    const body = await request.json();
    const clientId = Number(body.clientId) || locals.clientId;
    const { documentType, identification, email, turnstileToken } = body;

    if (
      !turnstileToken ||
      !(await verifyTurnstileToken(turnstileToken, getClientAddress()))
    ) {
      return json(
        { success: false, message: "Verificación de seguridad fallida" },
        { status: 400 },
      );
    }

    if (!documentType || !identification || !email) {
      return json(
        { success: false, message: "Todos los campos son requeridos" },
        { status: 400 },
      );
    }

    const resetToken = generateSecureToken(32);

    const result = await apiPost<PasswordResetApiResponse>(
      tunnelUrl,
      "/auth/solicitar-recuperacion",
      {
        document_type: String(documentType).trim(),
        identification: String(identification).trim(),
        email: String(email).trim().toLowerCase(),
        reset_token: resetToken,
        client_id: clientId,
      },
    );

    if (result.ok && result.data?.email) {
      sendPasswordResetEmail({
        clientId,
        email: result.data.email,
        identification,
        token: resetToken,
        originUrl: url.origin,
        tunnelUrl,
        tenant: locals.tenant,
      }).catch(() => {});
    }

    return json({
      success: true,
      message:
        "Si los datos coinciden con una cuenta registrada, recibirás un enlace de recuperación en tu correo.",
    });
  } catch (err) {
    error(500, JSON.stringify(err));
  }
};
