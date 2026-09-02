import { apiGet, apiPost } from "$lib/server/api";
import type { Appointment, RawAppointmentApi } from "$lib/types/appointments";
import { json, type RequestHandler } from "@sveltejs/kit";

function parseCitaDateTime(
  dateStr: string | Date | undefined,
  timeStr: string | Date | undefined,
): Date {
  let year = 2026,
    month = 0,
    day = 1;
  if (typeof dateStr === "string") {
    const [y, m, d] = dateStr.split("T")[0].split("-").map(Number);
    year = y;
    month = m - 1;
    day = d;
  } else if (dateStr instanceof Date) {
    year = dateStr.getUTCFullYear();
    month = dateStr.getUTCMonth();
    day = dateStr.getUTCDate();
  }

  let hours = 0,
    minutes = 0;
  if (typeof timeStr === "string") {
    const timePart = timeStr.includes("T") ? timeStr.split("T")[1] : timeStr;
    const [h, min] = timePart.split(":").map(Number);
    hours = h || 0;
    minutes = min || 0;
  } else if (timeStr instanceof Date) {
    hours = timeStr.getUTCHours();
    minutes = timeStr.getUTCMinutes();
  }

  return new Date(year, month, day, hours, minutes, 0);
}

export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    const patientCode = Number(locals.user?.patientId);
    const clientId = locals.clientId || 67;

    if (!patientCode) {
      return json(
        { success: false, message: "No autenticado" },
        { status: 401 },
      );
    }

    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const pageSize = Math.max(1, Number(url.searchParams.get("pageSize") || 5));
    const type = url.searchParams.get("type") || "all";

    const rawCitas = await apiGet<RawAppointmentApi[]>(
      `/pacientes/${patientCode}/citas`,
      {
        id_cliente: clientId,
      },
    );

    const now = new Date();
    const allAppointments: Appointment[] = (rawCitas || []).map(
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

    let filtered = allAppointments;
    if (type === "futuras") {
      filtered = allAppointments.filter(
        (c) => parseCitaDateTime(c.appointmentDate, c.appointmentTime) >= now,
      );
    } else if (type === "anteriores") {
      filtered = allAppointments.filter(
        (c) => parseCitaDateTime(c.appointmentDate, c.appointmentTime) < now,
      );
    }

    const totalRecords = filtered.length;
    const totalPages = Math.ceil(totalRecords / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;
    const items = filtered.slice(startIndex, startIndex + pageSize);

    return json({ items, totalRecords, page, pageSize, totalPages });
  } catch {
    return json(
      { items: [], totalRecords: 0, page: 1, pageSize: 5, totalPages: 1 },
      { status: 500 },
    );
  }
};

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const clientId = locals.clientId || 67;
    const patientCode = Number(locals.user?.patientId);

    const {
      fechaServicio,
      horaServicio,
      idProfesional,
      idActividadCita,
      claveCita,
      idSede,
      edad = 0,
      ume = "A",
    } = body;

    const appointmentDateTime = parseCitaDateTime(fechaServicio, horaServicio);
    if (appointmentDateTime <= new Date()) {
      return json(
        {
          success: false,
          message: "No es posible asignar una cita en un horario que ya pasó.",
        },
        { status: 400 },
      );
    }

    const result = await apiPost("/citas", {
      fecha_servicio: String(fechaServicio).split("T")[0],
      hora_servicio: String(horaServicio),
      codigo_paciente: String(patientCode),
      id_profesional: Number(idProfesional),
      id_cliente: clientId,
      id_actividad_cita: Number(idActividadCita),
      clave_cita: String(claveCita),
      id_sede: Number(idSede),
      edad: Number(edad),
      ume:
        ume === "AÑOS"
          ? "A"
          : ume === "MESES"
            ? "M"
            : ume === "DIAS"
              ? "D"
              : ume,
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

    return json({ success: true, result: result.data });
  } catch {
    return json(
      { success: false, message: "Error al grabar la cita" },
      { status: 500 },
    );
  }
};
