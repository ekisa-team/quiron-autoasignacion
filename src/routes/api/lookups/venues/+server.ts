import { apiGet } from "$lib/server/api";
import type { RawVenueApi } from "$lib/types/appointments";
import { json, type RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ locals }) => {
  try {
    const clientId = locals.clientId || 67;
    const venues = await apiGet<RawVenueApi[]>("/sedes", {
      id_cliente: clientId,
    });
    return json(venues || []);
  } catch {
    return json([], { status: 500 });
  }
};
