import { apiGet } from "$lib/server/api";
import type { RawActivityApi } from "$lib/types/appointments";
import { json, type RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    const clientId = locals.clientId || 67;
    const serviceId = Number(url.searchParams.get("idServicio")) || 0;

    const activities =
      serviceId > 0
        ? await apiGet<RawActivityApi[]>("/actividades", {
            id_cliente: clientId,
            id_servicio: serviceId,
          })
        : await apiGet<RawActivityApi[]>("/actividades/todas");

    return json(activities || []);
  } catch {
    return json([], { status: 500 });
  }
};
