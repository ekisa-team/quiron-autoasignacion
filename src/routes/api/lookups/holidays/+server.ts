import { apiGet } from "$lib/server/api";
import { error, json, type RequestHandler } from "@sveltejs/kit";

interface HolidayRow {
  FechaCalendario: Date;
}

export const GET: RequestHandler = async ({ locals }) => {
  const tunnelUrl = locals.tenant?.hclapiUrl;
  if (!tunnelUrl) {
    error(500, "Tunnel url not found");
  }

  const clientId = locals.clientId;

  try {
    const holidays = await apiGet<HolidayRow[]>(
      tunnelUrl,
      "/lookups/holidays",
      {
        id_cliente: clientId,
      },
    );

    return json(holidays || []);
  } catch (err) {
    error(500, JSON.stringify(err));
  }
};
