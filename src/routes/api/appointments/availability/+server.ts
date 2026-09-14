import { apiGet } from "$lib/server/api";
import { error, json, type RequestHandler } from "@sveltejs/kit";

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const {
      fechaC,
      idProfesional,
      idServicio,
      idActividad,
      idSede,
      page = 1,
      pageSize = 50,
    } = body;

    const tunnelUrl = locals.tenant?.apirUrl;
    if (!tunnelUrl) {
      error(500, "No se pudo obtener la URL de apir");
    }

    const clientId = locals.clientId;

    if (!fechaC || !idSede) {
      error(400, "Faltan parámetros de búsqueda");
    }

    const rawSlots = await apiGet<any[]>(tunnelUrl, "/agenda", {
      fecha: String(fechaC).split("T")[0],
      id_sede: Number(idSede),
      id_cliente: clientId,
      id_profesional: Number(idProfesional),
      id_servicio: Number(idServicio),
      id_actividad: Number(idActividad),
      page: Number(page),
      page_size: Number(pageSize),
    });

    const availableSlots = (rawSlots || []).map((s: any) => ({
      appointmentKey: s.ClaveCita,
      appointmentDate: s.FechaCita,
      appointmentTime: s.HoraCita,
      venueName: s.NombreSede,
      professionalName: s.NombreProfesional,
      venueAddress: s.DireccionSede,
      professionalId: s.IdProfesional,
    }));

    const totalRecords = rawSlots?.[0]?.TotalRecords ?? 0;
    const totalPages = Math.ceil(totalRecords / pageSize) || 1;

    return json({
      items: availableSlots,
      totalRecords,
      page,
      pageSize,
      totalPages,
    });
  } catch (err) {
    error(500, JSON.stringify(err));
  }
};
