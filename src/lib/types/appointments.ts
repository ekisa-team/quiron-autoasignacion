export interface Venue {
  id: number;
  name: string;
}

export interface MedicalService {
  id: number;
  name: string;
}

export interface AppointmentType {
  id: number;
  serviceId: number | null;
  name: string;
}

export interface Appointment {
  appointmentKey: number;
  activityName: string;
  professionalName: string;
  appointmentDate: string;
  appointmentTime: string;
  venueName: string;
  status: string;
}

export interface AvailabilitySlot {
  appointmentKey: number;
  appointmentDate: string;
  appointmentTime: string;
  venueName: string;
  professionalName: string;
  venueAddress: string;
  professionalId?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  totalRecords: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DocumentTypeOption {
  value: string;
  label: string;
}

export interface RawVenueApi {
  IdSede: number;
  NombreSede: string;
}

export interface RawServiceApi {
  IdServicio: number;
  NombreServicio: string;
}

export interface RawActivityApi {
  IdActividad: number;
  IdServicio: number | null;
  NombreActividad: string;
}

export interface RawAppointmentApi {
  ClaveCita: number;
  NombreActividad: string;
  NombreProfesional: string;
  FechaCita: string;
  HoraCita: string;
  NombreSede: string;
  EstadoServicio: string;
}

export interface RawSlotApi {
  ClaveCita: number;
  FechaCita: string;
  HoraCita: string;
  NombreSede: string;
  NombreProfesional: string;
  DireccionSede: string;
  IdProfesional: number;
}
