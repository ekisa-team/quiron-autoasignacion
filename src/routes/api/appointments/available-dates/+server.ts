import { apiGet } from "$lib/server/api";
import { error, json, type RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    const clientId = locals.clientId;
    const venueId = Number(url.searchParams.get("venueId"));
    const serviceId = Number(url.searchParams.get("serviceId"));

    const tunnelUrl = locals.tenant?.esquemaUrl;
    if (!tunnelUrl) {
      error(500, "Missing HCL API URL");
    }

    const rawDates = await apiGet<Record<string, unknown>[]>(
      tunnelUrl,
      "/agenda/fechas-disponibles",
      {
        id_cliente: clientId,
        id_sede: venueId,
        id_servicio: serviceId,
      },
    );

    const dates: string[] = (rawDates || []).map(
      (row: Record<string, unknown>): string => {
        const firstVal = Object.values(row)[0];
        if (!firstVal) return "";
        return String(firstVal).split("T")[0].trim();
      },
    );

    return json(dates);
  } catch (err) {
    error(500, JSON.stringify(err));
  }
};
