import { apiGet } from "$lib/server/api";
import type {
  Appointment,
  AppointmentType,
  MedicalService,
  RawActivityApi,
  RawServiceApi,
  RawVenueApi,
  Venue,
} from "$lib/types/appointments";
import type { PageServerLoad } from "./$types";

interface HolidayApiRow {
  fechaCalendario?: string | Date;
  FechaCalendario?: string | Date;
}

export const load: PageServerLoad = async ({ locals }) => {
  const clientId = locals.clientId || 67;
  const patientCode = Number(locals.user?.patientId) || 0;
  const tunnelUrl = locals.tenant?.hclapiUrl;

  try {
    const [
      venuesRes,
      servicesRes,
      activitiesRes,
      holidaysRes,
      futureRes,
      pastRes,
    ] = await Promise.all([
      apiGet<RawVenueApi[]>("/sedes", { id_cliente: clientId }, tunnelUrl),
      apiGet<RawServiceApi[]>(
        "/servicios",
        { id_cliente: clientId },
        tunnelUrl,
      ),
      apiGet<RawActivityApi[]>(
        "/actividades",
        { id_cliente: clientId, id_servicio: 0 },
        tunnelUrl,
      ),
      apiGet<HolidayApiRow[]>("/lookups/holidays", undefined, tunnelUrl),
      patientCode > 0
        ? apiGet<any[]>(
            `/pacientes/${patientCode}/citas`,
            { id_cliente: clientId, tipo: "FUTURAS", page: 1, page_size: 5 },
            tunnelUrl,
          )
        : Promise.resolve([]),
      patientCode > 0
        ? apiGet<any[]>(
            `/pacientes/${patientCode}/citas`,
            { id_cliente: clientId, tipo: "ANTERIORES", page: 1, page_size: 5 },
            tunnelUrl,
          )
        : Promise.resolve([]),
    ]);

    const venues: Venue[] = (venuesRes || []).map((s) => ({
      id: s.IdSede ?? s.idSede ?? 0,
      name: s.NombreSede ?? s.nombreSede ?? "",
    }));

    const services: MedicalService[] = (servicesRes || []).map((s) => ({
      id: s.IdServicio ?? s.idServicio ?? 0,
      name: s.NombreServicio ?? s.nombreServicio ?? s.Nombre ?? "",
    }));

    const activities: AppointmentType[] = (activitiesRes || []).map((a) => ({
      id: a.IdActividad ?? a.idActividad ?? 0,
      serviceId: a.IdServicio ?? a.idServicio ?? null,
      name: a.NombreActividad ?? a.nombreActividad ?? "",
    }));

    const holidays: string[] = (holidaysRes || [])
      .map((f: HolidayApiRow): string | null => {
        const raw = f.fechaCalendario ?? f.FechaCalendario;
        if (!raw) return null;
        const d = new Date(raw);
        return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0];
      })
      .filter((d): d is string => d !== null);

    const mapAppointments = (raw: any[]): Appointment[] =>
      (raw || []).map((c) => ({
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

    const futureItems = mapAppointments(futureRes || []);
    const totalFuture =
      futureRes && futureRes.length > 0 ? (futureRes[0].TotalRecords ?? 0) : 0;

    const pastItems = mapAppointments(pastRes || []);
    const totalPast =
      pastRes && pastRes.length > 0 ? (pastRes[0].TotalRecords ?? 0) : 0;

    return {
      user: locals.user,
      tenant: locals.tenant,
      venues,
      services,
      activities,
      holidays,
      futureAppointments: {
        items: futureItems,
        totalRecords: totalFuture,
        page: 1,
        pageSize: 5,
        totalPages: Math.ceil(totalFuture / 5) || 1,
      },
      pastAppointments: {
        items: pastItems,
        totalRecords: totalPast,
        page: 1,
        pageSize: 5,
        totalPages: Math.ceil(totalPast / 5) || 1,
      },
    };
  } catch {
    return {
      user: locals.user,
      tenant: locals.tenant,
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
