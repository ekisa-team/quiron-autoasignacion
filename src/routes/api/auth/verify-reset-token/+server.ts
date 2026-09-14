import { apiGet } from "$lib/server/api";
import { error, json, type RequestHandler } from "@sveltejs/kit";

export const POST: RequestHandler = async ({ request, locals }) => {
  const tunnelUrl = locals.tenant?.apirUrl;
  if (!tunnelUrl) {
    error(500, "Tunnel url not found");
  }

  try {
    const { token, identification, clientId } = await request.json();
    const activeClientId = Number(clientId) || locals.clientId;

    if (!token || !identification) {
      return json({ success: false, valid: false });
    }

    const result = await apiGet<{ valid?: boolean }>(
      tunnelUrl,
      "/auth/validar-token-recuperacion",
      {
        token: String(token).trim(),
        identificacion: String(identification).trim(),
        id_cliente: activeClientId,
      },
    );

    return json({ success: true, valid: Boolean(result?.valid) });
  } catch (err) {
    error(500, JSON.stringify(err));
  }
};
