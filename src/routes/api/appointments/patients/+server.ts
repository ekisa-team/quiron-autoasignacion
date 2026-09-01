import { executeProcedure } from "$lib/server/db";
import { json, type RequestHandler } from "@sveltejs/kit";
import mssql from "mssql";

function parseCitaDateTime(fecha: any, hora: any): Date {
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

    const rawCitas = await executeProcedure<any>(
      clientId,
      "Proc_Aut_ConsultarCitasPaciente",
      {
        CodigoPaciente: { type: mssql.Int, value: patientCode },
        IdCliente: { type: mssql.Int, value: clientId },
      },
    );

    const now = new Date();
    const allCitas = (rawCitas || []).map((c: any) => ({
      claveCita: c.claveCita ?? c.ClaveCita ?? 0,
      nombreActividad: c.nombreActividad ?? c.NombreActividad ?? "",
      nombreProfesional: c.nombreProfesional ?? c.NombreProfesional ?? "",
      fechaCita: c.fechaCita ?? c.FechaCita ?? "",
      horaCita: c.horaCita ?? c.HoraCita ?? "",
      nombreSede: c.nombreSede ?? c.NombreSede ?? "",
      estadoServicio: (
        c.estadoServicio ??
        c.EstadoServicio ??
        "ASIGNADA"
      ).toUpperCase(),
    }));

    let filtered = allCitas;
    if (type === "futuras") {
      filtered = allCitas.filter(
        (c) => parseCitaDateTime(c.fechaCita, c.horaCita) >= now,
      );
    } else if (type === "anteriores") {
      filtered = allCitas.filter(
        (c) => parseCitaDateTime(c.fechaCita, c.horaCita) < now,
      );
    }

    const totalRecords = filtered.length;
    const totalPages = Math.ceil(totalRecords / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;
    const items = filtered.slice(startIndex, startIndex + pageSize);

    return json({ items, totalRecords, page, pageSize, totalPages });
  } catch (error) {
    console.error("[API Patient Appointments Error]:", error);
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
      ume = "AÑOS",
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

    const result = await executeProcedure(clientId, "Proc_Aut_GrabarCitas", {
      FechaServicio: { type: mssql.Date, value: new Date(fechaServicio) },
      HoraServicio: { type: mssql.VarChar, value: String(horaServicio) },
      CodigoPaciente: { type: mssql.Int, value: patientCode },
      IdProfesional: { type: mssql.Int, value: Number(idProfesional) },
      IdCliente: { type: mssql.Int, value: clientId },
      IdActividadCita: { type: mssql.Int, value: Number(idActividadCita) },
      ClaveCita: { type: mssql.Int, value: Number(claveCita) },
      IdSede: { type: mssql.Int, value: Number(idSede) },
      Edad: { type: mssql.Int, value: Number(edad) },
      UME: { type: mssql.VarChar, value: ume },
    });

    return json({ success: true, result });
  } catch (error) {
    console.error("[API Book Appointment Error]:", error);
    return json(
      { success: false, message: "Error al grabar la cita" },
      { status: 500 },
    );
  }
};
