import { apiPost } from "$lib/server/api";
import { generateAccessToken, generateRefreshToken } from "$lib/server/jwt";
import { verifyPassword } from "$lib/server/password";
import { verifyTurnstileToken } from "$lib/server/turnstile";
import type { RawPatientLoginApi } from "$lib/types/auth";
import { error, json, type RequestHandler } from "@sveltejs/kit";

export const POST: RequestHandler = async ({
  request,
  cookies,
  locals,
  getClientAddress,
}) => {
  const tunnelUrl = locals.tenant?.esquemaUrl;
  if (!tunnelUrl) {
    error(500, "Tunnel url not found");
  }

  try {
    const body = await request.json();
    const { identification, password, documentType, turnstileToken } = body;
    const clientId = Number(body.clientId) || locals.clientId;

    if (
      !turnstileToken ||
      !(await verifyTurnstileToken(turnstileToken, getClientAddress()))
    ) {
      return json(
        { success: false, message: "Verificación de seguridad fallida" },
        { status: 400 },
      );
    }

    if (!identification || !password || !documentType) {
      return json(
        { success: false, message: "Faltan credenciales requeridas" },
        { status: 400 },
      );
    }

    const response = await apiPost<RawPatientLoginApi>(
      tunnelUrl,
      "/auth/login",
      {
        identificacion: String(identification).trim(),
        codigo_tipo_documento: String(documentType).trim(),
        id_cliente: clientId,
      },
    );

    const user = response.data;

    if (!response.ok || !user || !user.UsuarioId || !user.PasswordHash) {
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

    if (!isPasswordValid) {
      const failedRes = await apiPost<{ Intentos: number; Bloqueado: number }>(
        tunnelUrl,
        "/auth/intento-fallido",
        {
          usuario_id: user.UsuarioId,
        },
      );

      if (failedRes.ok && failedRes.data) {
        if (failedRes.data.Bloqueado === 1) {
          return json(
            {
              success: false,
              message:
                "Has superado el límite de 5 intentos. Tu cuenta ha sido bloqueada por 15 minutos.",
            },
            { status: 403 },
          );
        } else {
          const intentosRestantes = 5 - failedRes.data.Intentos;
          return json(
            {
              success: false,
              message: `Identificación o contraseña incorrecta. Intentos restantes: ${intentosRestantes}`,
            },
            { status: 401 },
          );
        }
      } else {
        error(401, "Identificación o contraseña incorrecta.");
      }
    }

    await apiPost(tunnelUrl, "/auth/login-exitoso", {
      usuario_id: user.UsuarioId,
    });

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
      secure: false,
      maxAge: 60 * 120,
    });

    cookies.set("refresh_token", refreshToken, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: false,
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
  } catch (err) {
    error(500, JSON.stringify(err));
  }
};
