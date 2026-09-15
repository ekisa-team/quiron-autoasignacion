import { apiGet } from "$lib/server/api";
import { error, json, type RequestHandler } from "@sveltejs/kit";

interface ProfessionalRow {
  IdProfesional?: number;
  NombreProfesional?: string;
}

export const GET: RequestHandler = async ({ locals }) => {
  const tunnelUrl = locals.tenant?.esquemaUrl;
  if (!tunnelUrl) {
    error(500, "Tunnel url not found");
  }

  const clientId = locals.clientId;

  try {
    const professionals = await apiGet<ProfessionalRow[]>(
      tunnelUrl,
      "/profesionales",
      {
        id_cliente: clientId,
      },
    );

    return json(professionals || []);
  } catch (err) {
    error(500, JSON.stringify(err));
  }
};
