import { apiGet } from "$lib/server/api";
import type {
  Appointment,
  MedicalService,
  RawServiceApi,
  RawVenueApi,
  Venue,
} from "$lib/types/appointments";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

interface HolidayApiRow {
  FechaCalendario: string;
}

export const load: PageServerLoad = async ({ locals }) => {
  const clientId = locals.clientId;
  const patientCode = Number(locals.user?.patientId);
  const tunnelUrl = locals.tenant?.hclapiUrl;

  if (!tunnelUrl) {
    error(500, "Tunnel url not found");
  }

  try {
    const [venuesRes, servicesRes, holidaysRes, futureRes, pastRes] =
      await Promise.all([
        apiGet<RawVenueApi[]>(tunnelUrl, "/sedes", { id_cliente: clientId }),
        apiGet<RawServiceApi[]>(tunnelUrl, "/servicios", {
          id_cliente: clientId,
        }),
        apiGet<HolidayApiRow[]>(tunnelUrl, "/lookups/holidays", undefined),
        patientCode > 0
          ? apiGet<any[]>(tunnelUrl, `/pacientes/${patientCode}/citas`, {
              id_cliente: clientId,
              tipo: "FUTURAS",
              page: 1,
              page_size: 5,
            })
          : Promise.resolve([]),
        patientCode > 0
          ? apiGet<any[]>(tunnelUrl, `/pacientes/${patientCode}/citas`, {
              id_cliente: clientId,
              tipo: "ANTERIORES",
              page: 1,
              page_size: 5,
            })
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

    const holidays: string[] = (holidaysRes || []).map(
      (f: HolidayApiRow) =>
        new Date(f.FechaCalendario).toISOString().split("T")[0],
    );

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
  } catch (err) {
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    error(500, message);
  }
};
