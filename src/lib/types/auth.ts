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

export interface RegisterPatientPayload {
  documentType: string;
  identification: string;
  firstName: string;
  secondName?: string;
  firstLastName: string;
  secondLastName?: string;
  birthDate: string;
  gender: string;
  address?: string;
  phone?: string;
  mobile: string;
  email: string;
  password: string;
  captchaToken?: string;
  clientId?: number;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
  clientId?: number;
}

export interface ForgotPasswordPayload {
  documentType: string;
  identification: string;
  email: string;
  captchaToken?: string;
  clientId?: number;
}
