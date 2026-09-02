import { apiGet } from "$lib/server/api";
import type { RawSlotApi } from "$lib/types/appointments";
import { json, type RequestHandler } from "@sveltejs/kit";

function parseSlotDateTime(
  fecha: string | Date | undefined,
  hora: string | Date | undefined,
): Date {
  let year = 2026,
    month = 0,
    day = 1;
  if (typeof fecha === "string") {
    const [y, m, d] = fecha.split("T")[0].split("-").map(Number);
    year = y;
    month = m - 1;
    day = d;
  } else if (fecha instanceof Date) {
    year = fecha.getUTCFullYear();
    month = fecha.getUTCMonth();
    day = fecha.getUTCDate();
  }

  let hours = 0,
    minutes = 0;
  if (typeof hora === "string") {
    const timePart = hora.includes("T") ? hora.split("T")[1] : hora;
    const [h, min] = timePart.split(":").map(Number);
    hours = h || 0;
    minutes = min || 0;
  } else if (hora instanceof Date) {
    hours = hora.getUTCHours();
    minutes = hora.getUTCMinutes();
  }

  return new Date(year, month, day, hours, minutes, 0);
}

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { fechaC, idProfesional, idServicio, idActividad, idSede } = body;
    const clientId = locals.clientId || 67;

    if (!fechaC || !idSede) {
      return json(
        { success: false, message: "Faltan parámetros de búsqueda" },
        { status: 400 },
      );
    }

    const rawSlots = await apiGet<RawSlotApi[]>("/agenda", {
      fecha: String(fechaC).split("T")[0],
      id_sede: Number(idSede),
      id_cliente: clientId,
      id_profesional: Number(idProfesional) || 0,
      id_servicio: Number(idServicio) || 0,
      id_actividad: Number(idActividad) || 0,
    });

    const minTimeAllowed = new Date(Date.now() + 10 * 60 * 1000);
    const availableSlots = (rawSlots || []).filter((slot) => {
      const slotDateTime = parseSlotDateTime(
        slot.FechaCita || slot.fechaCita,
        slot.HoraCita || slot.horaCita,
      );
      return slotDateTime > minTimeAllowed;
    });

    return json(availableSlots);
  } catch {
    return json([], { status: 500 });
  }
};
