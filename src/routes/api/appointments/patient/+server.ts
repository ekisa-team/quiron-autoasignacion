import { apiGet, apiPost } from "$lib/server/api";
import { sendAppointmentConfirmationEmail } from "$lib/server/email";
import type { Appointment, RawAppointmentApi } from "$lib/types/appointments";
import { error, json, type RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ url, locals }) => {
  const tunnelUrl = locals.tenant?.hclapiUrl;
  if (!tunnelUrl) {
    error(500, "No se pudo obtener la URL de HCLAPI");
  }

  const patientCode = Number(locals.user?.patientId);
  if (!patientCode) {
    error(401, "No autenticado");
  }

  const clientId = locals.clientId;

  try {
    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const pageSize = Math.max(1, Number(url.searchParams.get("pageSize") || 5));
    const rawType = url.searchParams.get("type") || "all";

    const tipoConsulta =
      rawType === "futuras"
        ? "FUTURAS"
        : rawType === "anteriores"
          ? "ANTERIORES"
          : "TODAS";

    const rawCitas = await apiGet<RawAppointmentApi[]>(
      tunnelUrl,
      `/pacientes/${patientCode}/citas`,
      {
        id_cliente: clientId,
        tipo: tipoConsulta,
        page: page,
        page_size: pageSize,
      },
    );

    const items: Appointment[] = (rawCitas || []).map(
      (c: RawAppointmentApi): Appointment => ({
        appointmentKey: c.ClaveCita ?? c.claveCita ?? 0,
        activityName: c.NombreActividad ?? c.nombreActividad ?? "",
        professionalName: c.NombreProfesional ?? c.nombreProfesional ?? "",
        appointmentDate: c.FechaCita ?? c.fechaCita ?? "",
        appointmentTime: c.HoraCita ?? c.horaCita ?? "",
        venueName: c.NombreSede ?? c.nombreSede ?? "",
        status: (
          c.EstadoServicio ??
          c.estadoServicio ??
          "ASIGNADA"
        ).toUpperCase(),
      }),
    );

    const totalRecords =
      rawCitas && rawCitas.length > 0
        ? ((rawCitas[0] as any).TotalRecords ?? 0)
        : 0;
    const totalPages = Math.ceil(totalRecords / pageSize) || 1;

    return json({ items, totalRecords, page, pageSize, totalPages });
  } catch {
    return json(
      { items: [], totalRecords: 0, page: 1, pageSize: 5, totalPages: 1 },
      { status: 500 },
    );
  }
};

export const POST: RequestHandler = async ({ request, locals, url }) => {
  const tunnelUrl = locals.tenant?.hclapiUrl;
  if (!tunnelUrl) {
    error(500, "No se pudo obtener la URL de HCLAPI");
  }

  try {
    const body = await request.json();
    const clientId = locals.clientId;
    const patientCode = Number(locals.user?.patientId);
    const {
      fechaServicio,
      horaServicio,
      idProfesional,
      idActividadCita,
      claveCita,
      idSede,
      edad = 0,
      ume = "AÑOS",
      activityName,
      professionalName,
      venueName,
    } = body;

    const result = await apiPost(tunnelUrl, "/citas", {
      fecha_servicio: String(fechaServicio).split("T")[0],
      hora_servicio: String(horaServicio),
      codigo_paciente: String(patientCode),
      id_profesional: Number(idProfesional),
      id_cliente: clientId,
      id_actividad_cita: Number(idActividadCita),
      clave_cita: String(claveCita),
      id_sede: Number(idSede),
      edad: Number(edad),
      ume: String(ume || "AÑOS")
        .trim()
        .toUpperCase(),
    });

    if (!result.ok) {
      return json(
        {
          success: false,
          message: "El cupo o la clave de cita ya se encuentra reservada",
        },
        { status: 409 },
      );
    }

    if (locals.user?.email && activityName && venueName) {
      sendAppointmentConfirmationEmail({
        clientId,
        email: locals.user.email,
        patientName: locals.user.fullName,
        activityName,
        professionalName: professionalName || "Asignado por la institución",
        date: fechaServicio,
        time: horaServicio,
        venueName,
        originUrl: url.origin,
        tenant: locals.tenant,
        tunnelUrl,
      }).catch((e) => console.error("[Email Error]:", e));
    }

    return json({ success: true, result: result.data });
  } catch (err) {
    error(500, JSON.stringify(err));
  }
};
