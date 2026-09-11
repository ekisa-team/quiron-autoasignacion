import { apiGet } from "$lib/server/api";
import type { RawVenueApi } from "$lib/types/appointments";
import { error, json, type RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ locals }) => {
  const tunnelUrl = locals.tenant?.hclapiUrl;
  if (!tunnelUrl) {
    error(500, "Tunnel url not found");
  }

  const clientId = locals.clientId;

  try {
    const venues = await apiGet<RawVenueApi[]>(tunnelUrl, "/sedes", {
      id_cliente: clientId,
    });
    return json(venues || []);
  } catch (err) {
    error(500, JSON.stringify(err));
  }
};
