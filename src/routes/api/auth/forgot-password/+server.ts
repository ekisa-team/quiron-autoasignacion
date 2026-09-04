import { apiPost } from "$lib/server/api";
import { sendPasswordResetEmail } from "$lib/server/email";
import { generateSecureToken } from "$lib/server/password";
import { verifyTurnstileToken } from "$lib/server/turnstile";
import { json, type RequestHandler } from "@sveltejs/kit";

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
  try {
    const body = await request.json();
    const { documentType, identification, email, captchaToken } = body;
    const clientId = Number(body.clientId) || locals.clientId || 67;
    const tunnelUrl = locals.tenant?.hclapiUrl;

    if (captchaToken) {
      const isCaptchaValid = await verifyTurnstileToken(
        captchaToken,
        getClientAddress(),
      );
      if (!isCaptchaValid) {
        return json(
          { success: false, message: "Verificación de seguridad fallida" },
          { status: 400 },
        );
      }
    }

    if (!documentType || !identification || !email) {
      return json(
        { success: false, message: "Todos los campos son requeridos" },
        { status: 400 },
      );
    }

    const resetToken = generateSecureToken(32);

    const result = await apiPost<PasswordResetApiResponse>(
      "/auth/solicitar-recuperacion",
      {
        document_type: String(documentType).trim(),
        identification: String(identification).trim(),
        email: String(email).trim().toLowerCase(),
        reset_token: resetToken,
        client_id: clientId,
      },
      tunnelUrl,
    );

    if (result.ok && result.data?.email) {
      await sendPasswordResetEmail(
        clientId,
        result.data.email,
        identification,
        resetToken,
        url.origin,
        tunnelUrl,
      );
    }

    return json({
      success: true,
      message:
        "Si los datos coinciden con una cuenta registrada, recibirás un enlace de recuperación en tu correo.",
    });
  } catch {
    return json({
      success: true,
      message:
        "Si los datos coinciden con una cuenta registrada, recibirás un enlace de recuperación en tu correo.",
    });
  }
};
