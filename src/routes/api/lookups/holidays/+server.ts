import { apiGet } from "$lib/server/api";
import { json, type RequestHandler } from "@sveltejs/kit";

interface HolidayRow {
  fechaCalendario?: string | Date;
  FechaCalendario?: string | Date;
}

export const GET: RequestHandler = async ({ locals }) => {
  try {
    const clientId = locals.clientId || 67;
    const holidays = await apiGet<HolidayRow[]>("/lookups/holidays", {
      id_cliente: clientId,
    });

    const result = (holidays || [])
      .map((f: HolidayRow) => {
        const val = f.fechaCalendario ?? f.FechaCalendario;
        return val ? new Date(val) : null;
      })
      .filter((d): d is Date => d !== null);

    return json(result);
  } catch (error) {
    return json([], { status: 500 });
  }
};
