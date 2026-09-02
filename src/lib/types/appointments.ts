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
  IdSede?: number;
  idSede?: number;
  NombreSede?: string;
  nombreSede?: string;
}

export interface RawServiceApi {
  IdServicio?: number;
  idServicio?: number;
  NombreServicio?: string;
  nombreServicio?: string;
  Nombre?: string;
}

export interface RawActivityApi {
  IdActividad?: number;
  idActividad?: number;
  IdServicio?: number | null;
  idServicio?: number | null;
  NombreActividad?: string;
  nombreActividad?: string;
}

export interface RawAppointmentApi {
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

export interface RawSlotApi {
  ClaveCita?: number;
  claveCita?: number;
  FechaCita?: string;
  fechaCita?: string;
  HoraCita?: string;
  horaCita?: string;
  NombreSede?: string;
  nombreSede?: string;
  NombreProfesional?: string;
  nombreProfesional?: string;
  DireccionSede?: string;
  direccionSede?: string;
  IdProfesional?: number;
  idProfesional?: number;
}
