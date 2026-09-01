import { executeProcedure } from "$lib/server/db";
import { json, type RequestHandler } from "@sveltejs/kit";
import mssql from "mssql";

function parseSlotDateTime(fecha: any, hora: any): Date {
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

    const rawSlots = await executeProcedure<any>(
      clientId,
      "Proc_Aut_AgendaCitas",
      {
        FechaC: { type: mssql.SmallDateTime, value: new Date(fechaC) },
        IdSede: { type: mssql.Int, value: Number(idSede) },
        IdCliente: { type: mssql.Int, value: clientId },
        IdProfesional: { type: mssql.Int, value: Number(idProfesional) || 0 },
        IdServicio: { type: mssql.Int, value: Number(idServicio) || 0 },
        IdActividad: { type: mssql.Int, value: Number(idActividad) || 0 },
      },
    );

    const minTimeAllowed = new Date(Date.now() + 10 * 60 * 1000);
    const availableSlots = (rawSlots || []).filter((slot: any) => {
      const slotDateTime = parseSlotDateTime(
        slot.FechaCita || slot.fechaCita,
        slot.HoraCita || slot.horaCita,
      );
      return slotDateTime > minTimeAllowed;
    });

    return json(availableSlots);
  } catch (error: any) {
    console.error("[API Availability Error]:", error.message);
    return json([], { status: 500 });
  }
};
