import { apiGet } from "$lib/server/api";
import type { RawActivityApi } from "$lib/types/appointments";
import { error, json, type RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ url, locals }) => {
  const tunnelUrl = locals.tenant?.hclapiUrl;
  if (!tunnelUrl) {
    error(500, "Tunnel url not found");
  }

  try {
    const clientId = locals.clientId;
    const serviceId = Number(url.searchParams.get("idServicio")) || 0;

    const activities = await apiGet<RawActivityApi[]>(
      tunnelUrl,
      "/actividades",
      {
        id_cliente: clientId,
        id_servicio: serviceId,
      },
    );

    return json(activities || []);
  } catch (err) {
    error(500, JSON.stringify(err));
  }
};
