import { executeProcedure, executeQuery } from "$lib/server/db";
import type {
  Appointment,
  AppointmentType,
  MedicalService,
  Venue,
} from "$lib/types/appointments";
import mssql from "mssql";
import type { PageServerLoad } from "./$types";

function parseAppointmentDateTime(
  dateStr: string | Date,
  timeStr: string | Date,
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

interface SedeSqlRow {
  IdSede?: number;
  idSede?: number;
  NombreSede?: string;
  nombreSede?: string;
}
interface ServicioSqlRow {
  IdServicio?: number;
  idServicio?: number;
  NombreServicio?: string;
  nombreServicio?: string;
}
interface ActividadSqlRow {
  IdActividad?: number;
  idActividad?: number;
  IdServicio?: number | null;
  idServicio?: number | null;
  NombreActividad?: string;
  nombreActividad?: string;
}
interface FestivoSqlRow {
  fechaCalendario?: Date;
  FechaCalendario?: Date;
}
interface CitaSqlRow {
  ClaveCita?: number;
  claveCita?: number;
  NombreActividad?: string;
  nombreActividad?: string;
  NombreProfesional?: string;
  nombreProfesional?: string;
  FechaCita?: string;
  fechaCita?: string;
  HoraCita?: string;
  horaCita?: string;
  NombreSede?: string;
  nombreSede?: string;
  EstadoServicio?: string;
  estadoServicio?: string;
}

export const load: PageServerLoad = async ({ locals }) => {
  const clientId = locals.clientId || 67;
  const patientCode = Number(locals.user?.patientId) || 0;

  try {
    const [
      venuesRes,
      servicesRes,
      activitiesRes,
      holidaysRes,
      appointmentsRes,
    ] = await Promise.all([
      executeProcedure<SedeSqlRow>(
        clientId,
        "Proc_Autoasignacion_ConsultarSedes",
        {
          IdCliente: { type: mssql.Int, value: clientId },
        },
      ).catch(() => []),

      executeProcedure<ServicioSqlRow>(
        clientId,
        "Proc_Aut_ConsultarServicios",
        {
          IdCliente: { type: mssql.Int, value: clientId },
        },
      ).catch(() => []),

      executeProcedure<ActividadSqlRow>(
        clientId,
        "Proc_Aut_ConsultarActividadesPorServicio",
        {
          IdCliente: { type: mssql.Int, value: clientId },
          IdServicio: { type: mssql.Int, value: 0 },
        },
      ).catch(() => []),

      executeQuery<FestivoSqlRow>(
        clientId,
        `SELECT fechaCalendario FROM dbo.Festivos`,
      ).catch(() => []),

      patientCode > 0
        ? executeProcedure<CitaSqlRow>(
            clientId,
            "Proc_Aut_ConsultarCitasPaciente",
            {
              CodigoPaciente: { type: mssql.Int, value: patientCode },
              IdCliente: { type: mssql.Int, value: clientId },
            },
          ).catch(() => [])
        : [],
    ]);

    const venues: Venue[] = (venuesRes || []).map((s) => ({
      id: s.IdSede ?? s.idSede ?? 0,
      name: s.NombreSede ?? s.nombreSede ?? "",
    }));

    const services: MedicalService[] = (servicesRes || []).map((s) => ({
      id: s.IdServicio ?? s.idServicio ?? 0,
      name: s.NombreServicio ?? s.nombreServicio ?? "",
    }));

    const activities: AppointmentType[] = (activitiesRes || []).map((a) => ({
      id: a.IdActividad ?? a.idActividad ?? 0,
      serviceId: a.IdServicio ?? a.idServicio ?? null,
      name: a.NombreActividad ?? a.nombreActividad ?? "",
    }));

    const holidays: string[] = (holidaysRes || [])
      .map((f) => {
        const raw = f.fechaCalendario ?? f.FechaCalendario;
        if (!raw) return null;
        const d = new Date(raw);
        return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0];
      })
      .filter((d): d is string => d !== null);

    const now = new Date();
    const allAppointments: Appointment[] = (appointmentsRes || []).map((c) => ({
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
    }));

    const allFuture = allAppointments.filter(
      (c) =>
        parseAppointmentDateTime(c.appointmentDate, c.appointmentTime) >= now,
    );
    const allPast = allAppointments.filter(
      (c) =>
        parseAppointmentDateTime(c.appointmentDate, c.appointmentTime) < now,
    );

    return {
      user: locals.user,
      venues,
      services,
      activities,
      holidays,
      futureAppointments: {
        items: allFuture.slice(0, 5),
        totalRecords: allFuture.length,
        page: 1,
        pageSize: 5,
        totalPages: Math.ceil(allFuture.length / 5) || 1,
      },
      pastAppointments: {
        items: allPast.slice(0, 5),
        totalRecords: allPast.length,
        page: 1,
        pageSize: 5,
        totalPages: Math.ceil(allPast.length / 5) || 1,
      },
    };
  } catch (error) {
    console.error("[Page Load Error]:", error);
    return {
      user: locals.user,
      venues: [],
      services: [],
      activities: [],
      holidays: [],
      futureAppointments: {
        items: [],
        totalRecords: 0,
        page: 1,
        pageSize: 5,
        totalPages: 1,
      },
      pastAppointments: {
        items: [],
        totalRecords: 0,
        page: 1,
        pageSize: 5,
        totalPages: 1,
      },
    };
  }
};
