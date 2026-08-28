import { env } from "$env/dynamic/private";
import jwt from "jsonwebtoken";

const SECRET_KEY =
  env.JWT_SECRET_KEY || "SsqUSZ7KIf3KEg8IcE4IvEpq1ALWgKQBXa2025";
const ISSUER = "QuironInstituciones";
const AUDIENCE = "Patients";
const ACCESS_TOKEN_EXPIRY = "30m";
const REFRESH_TOKEN_EXPIRY = "8h";

export type PatientJwtPayload = {
  userId: string;
  patientId: string;
  patientIdentification: string;
  clientId: string;
  fullName: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  phoneVerified?: boolean;
  userType?: "patient";
};

export function generateAccessToken(payload: PatientJwtPayload): string {
  return jwt.sign(
    {
      ...payload,
      UserType: "patient",
      TenantId: payload.clientId,
    },
    SECRET_KEY,
    {
      issuer: ISSUER,
      audience: AUDIENCE,
      expiresIn: ACCESS_TOKEN_EXPIRY,
    },
  );
}

export function generateRefreshToken(payload: PatientJwtPayload): string {
  return jwt.sign(
    {
      ...payload,
      UserType: "patient",
      TenantId: payload.clientId,
    },
    SECRET_KEY,
    {
      issuer: ISSUER,
      audience: AUDIENCE,
      expiresIn: REFRESH_TOKEN_EXPIRY,
    },
  );
}

export function validateToken(token: string): PatientJwtPayload | null {
  try {
    const decoded = jwt.verify(token, SECRET_KEY, {
      issuer: ISSUER,
      audience: AUDIENCE,
    }) as any;
    return {
      userId: decoded.userId || decoded.nameid,
      patientId: decoded.patientId || decoded.PatientId,
      patientIdentification:
        decoded.patientIdentification || decoded.PatientIdentification,
      clientId: decoded.clientId || decoded.ClientId || decoded.TenantId,
      fullName: decoded.fullName || decoded.name || "",
      email: decoded.email || "",
      phone: decoded.phone || "",
      emailVerified: Boolean(decoded.emailVerified || decoded.EmailVerified),
    };
  } catch (error) {
    return null;
  }
}
