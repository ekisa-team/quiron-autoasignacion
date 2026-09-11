import { apiGet } from "$lib/server/api";
import { error, json, type RequestHandler } from "@sveltejs/kit";

interface SexRow {
  Codigo: string;
  Nombre: string;
}

export const GET: RequestHandler = async ({ locals }) => {
  const tunnelUrl = locals.tenant?.hclapiUrl;
  if (!tunnelUrl) {
    error(500, "Tunnel url not found");
  }

  try {
    const sexes = await apiGet<SexRow[]>(
      tunnelUrl,
      "/lookups/biological-sexes",
    );
    return json(sexes || []);
  } catch (err) {
    error(500, JSON.stringify(err));
  }
};
