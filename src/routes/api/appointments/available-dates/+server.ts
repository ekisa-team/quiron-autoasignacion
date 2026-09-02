import { apiGet } from "$lib/server/api";
import { json, type RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    const clientId = locals.clientId || 67;
    const venueId = Number(url.searchParams.get("venueId")) || 0;
    const serviceId = Number(url.searchParams.get("serviceId")) || 0;

    const rawDates = await apiGet<Record<string, unknown>[]>(
      "/agenda/fechas-disponibles",
      {
        id_cliente: clientId,
        id_sede: venueId,
        id_servicio: serviceId,
      },
    );

    const dates: string[] = (rawDates || [])
      .map((row: Record<string, unknown>): string => {
        const firstVal = Object.values(row)[0];
        if (!firstVal) return "";
        return String(firstVal).split("T")[0].trim();
      })
      .filter((d: string) => d !== "");

    return json(dates);
  } catch {
    return json([]);
  }
};
