import { apiGet } from "$lib/server/api";
import { json, type RequestHandler } from "@sveltejs/kit";

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const { token, identification, clientId } = await request.json();
    const activeClientId = Number(clientId) || locals.clientId || 67;

    if (!token || !identification) {
      return json({ success: false, valid: false });
    }

    const result = await apiGet<{ valid?: boolean }>(
      "/auth/validar-token-recuperacion",
      {
        token: String(token).trim(),
        identificacion: String(identification).trim(),
        id_cliente: activeClientId,
      },
    );

    return json({ success: true, valid: Boolean(result?.valid) });
  } catch (error) {
    return json({ success: false, valid: false });
  }
};
