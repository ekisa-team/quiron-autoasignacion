import { executeProcedure, getTenantDb } from "$lib/server/db";
import { generateAccessToken, generateRefreshToken } from "$lib/server/jwt";
import { verifyPassword } from "$lib/server/password";
import { json, type RequestHandler } from "@sveltejs/kit";
import mssql from "mssql";

interface PacienteLoginRow {
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
  LockedUntil: Date | null;
}

export const POST: RequestHandler = async ({ request, cookies, locals }) => {
  try {
    const body = await request.json();
    const { identification, password, documentType } = body;
    const clientId = Number(body.clientId) || locals.clientId || 67;

    if (!identification || !password || !documentType) {
      return json(
        { success: false, message: "Faltan credenciales requeridas" },
        { status: 400 },
      );
    }

    const result = await executeProcedure<PacienteLoginRow>(
      clientId,
      "Proc_Aut_ConsultarPacienteLogin",
      {
        Identificacion: {
          type: mssql.VarChar(20),
          value: String(identification).trim(),
        },
        CodigoTipoDocumento: {
          type: mssql.VarChar(2),
          value: String(documentType).trim(),
        },
        IdCliente: { type: mssql.Int, value: clientId },
      },
    );

    const user = result[0];

    if (!user || !user.UsuarioId || !user.PasswordHash) {
      return json(
        {
          success: false,
          notRegistered: true,
          message:
            "El documento ingresado no se encuentra registrado. Te redirigiremos para que crees tu cuenta.",
        },
        { status: 404 },
      );
    }

    if (user.LockedUntil && new Date(user.LockedUntil).getTime() > Date.now()) {
      const minutesLeft = Math.ceil(
        (new Date(user.LockedUntil).getTime() - Date.now()) / 60000,
      );
      return json(
        {
          success: false,
          message: `Cuenta bloqueada temporalmente por múltiples intentos fallidos. Intenta en ${minutesLeft} minutos.`,
        },
        { status: 403 },
      );
    }

    const isPasswordValid = await verifyPassword(password, user.PasswordHash);
    const pool = await getTenantDb(clientId);

    if (!isPasswordValid) {
      const attempts = (user.LoginAttempts || 0) + 1;
      const lockReq = pool.request();
      lockReq.input("id", mssql.Int, user.UsuarioId);
      lockReq.input("attempts", mssql.Int, attempts);

      if (attempts >= 5) {
        await lockReq.query(`
					UPDATE dbo.UsuarioPaciente 
					SET LoginAttempts = @attempts, LockedUntil = DATEADD(minute, 15, SYSUTCDATETIME()), UpdatedAt = SYSUTCDATETIME() 
					WHERE Id = @id
				`);
        return json(
          {
            success: false,
            message:
              "Has superado el límite de 5 intentos. Tu cuenta ha sido bloqueada por 15 minutos.",
          },
          { status: 403 },
        );
      } else {
        await lockReq.query(`
					UPDATE dbo.UsuarioPaciente 
					SET LoginAttempts = @attempts, UpdatedAt = SYSUTCDATETIME() 
					WHERE Id = @id
				`);
        return json(
          {
            success: false,
            message: `Identificación o contraseña incorrecta. Intentos restantes: ${5 - attempts}`,
          },
          { status: 401 },
        );
      }
    }

    const successReq = pool.request();
    successReq.input("id", mssql.Int, user.UsuarioId);
    await successReq.query(`
			UPDATE dbo.UsuarioPaciente 
			SET LoginAttempts = 0, LockedUntil = NULL, LastLoginAt = SYSUTCDATETIME(), UpdatedAt = SYSUTCDATETIME() 
			WHERE Id = @id
		`);

    const fullName =
      `${user.Nombre1Paciente || ""} ${user.Nombre2Paciente || ""} ${user.Apellido1Paciente || ""} ${user.Apellido2Paciente || ""}`
        .replace(/\s+/g, " ")
        .trim();

    const payload = {
      userId: user.UsuarioId.toString(),
      patientId: user.CodigoPaciente.toString(),
      patientIdentification: user.IdentificacionPaciente,
      clientId: clientId.toString(),
      fullName,
      email: user.CorreoPaciente || "",
      phone: user.CelularPaciente || user.TelefonoPaciente || "",
      emailVerified: Boolean(user.EmailVerified),
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    cookies.set("auth_token", accessToken, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 120,
    });

    cookies.set("refresh_token", refreshToken, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
    });

    return json({
      success: true,
      message: "Inicio de sesión exitoso",
      accessToken,
      refreshToken,
      userInfo: {
        id: user.UsuarioId,
        patientCode: user.CodigoPaciente,
        identification: user.IdentificacionPaciente,
        documentType: user.CodigoTipoDocumento,
        fullName,
        email: user.CorreoPaciente,
        phone: user.CelularPaciente,
        clientId,
      },
    });
  } catch (error) {
    console.error("[API Login Error]:", error);
    return json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 },
    );
  }
};
