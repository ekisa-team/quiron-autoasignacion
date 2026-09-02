export interface PatientUserSession {
  userId: string;
  patientId: string;
  patientIdentification: string;
  clientId: string;
  fullName: string;
  email: string;
  phone: string;
  emailVerified: boolean;
}

export interface LoginCredentials {
  identification: string;
  password: string;
  documentType: string;
  captchaToken?: string;
  clientId?: number;
}

export interface RawPatientLoginApi {
  CodigoPaciente: number;
  IdentificacionPaciente: string;
  CodigoTipoDocumento: string;
  Nombre1Paciente: string | null;
  Nombre2Paciente: string | null;
  Apellido1Paciente: string | null;
  Apellido2Paciente: string | null;
  CorreoPaciente: string | null;
  CelularPaciente: string | null;
  TelefonoPaciente: string | null;
  UsuarioId: number | null;
  PasswordHash: string | null;
  EmailVerified: boolean | null;
  PhoneVerified: boolean | null;
  LoginAttempts: number | null;
  LockedUntil: string | null;
}
