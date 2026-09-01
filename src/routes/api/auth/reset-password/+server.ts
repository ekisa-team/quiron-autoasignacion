import { getTenantDb } from "$lib/server/db";
import { sendPasswordChangeNotification } from "$lib/server/email";
import { hashPassword } from "$lib/server/password";
import { json, type RequestHandler } from "@sveltejs/kit";
import mssql from "mssql";

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { token, newPassword, clientId } = body;
    const activeClientId = Number(clientId) || locals.clientId || 67;

    if (!token || !newPassword) {
      return json(
        { success: false, message: "Token y nueva contraseña requeridos" },
        { status: 400 },
      );
    }

    if (String(newPassword).length < 6) {
      return json(
        {
          success: false,
          message: "La contraseña debe tener mínimo 6 caracteres",
        },
        { status: 400 },
      );
    }

    const pool = await getTenantDb(activeClientId);

    // 1. Buscar usuario por PasswordResetSecret en dbo.UsuarioPaciente
    const userReq = pool.request();
    userReq.input("token", mssql.VarChar(255), String(token).trim());
    userReq.input("clientId", mssql.Int, activeClientId);

    const userRes = await userReq.query(`
			SELECT TOP 1 
				u.Id, u.PatientId, u.ClientId, u.PasswordResetExpiresAt, 
				p.CorreoPaciente, p.IdentificacionPaciente
			FROM dbo.UsuarioPaciente u
			INNER JOIN dbo.Pacientes p ON p.CodigoPaciente = u.PatientId
			WHERE u.PasswordResetSecret = @token
			  AND u.ClientId = @clientId
		`);

    const user = userRes.recordset[0];
    if (!user) {
      console.warn(
        `⚠️ [Reset Password] No se encontró ningún usuario con el token "${token}" en el cliente ${activeClientId}`,
      );
      return json(
        {
          success: false,
          message: "El enlace de recuperación es inválido o no existe",
        },
        { status: 404 },
      );
    }

    // 2. Validar expiración de forma segura
    if (user.PasswordResetExpiresAt) {
      const expiryDate = new Date(user.PasswordResetExpiresAt);
      // Si la fecha de expiración es menor a ahora mismo en UTC
      if (expiryDate.getTime() < Date.now()) {
        console.warn(
          `⚠️ [Reset Password] El token expiró en: ${user.PasswordResetExpiresAt}`,
        );
        return json(
          {
            success: false,
            message:
              "El enlace de recuperación ha expirado. Por favor solicita uno nuevo.",
          },
          { status: 410 },
        );
      }
    }

    // 3. Hashear nueva contraseña con Argon2id
    const newHash = await hashPassword(newPassword);

    // 4. Actualizar en dbo.UsuarioPaciente y limpiar el token
    const updateReq = pool.request();
    updateReq.input("id", mssql.Int, user.Id);
    updateReq.input("hash", mssql.VarChar(255), newHash);

    await updateReq.query(`
			UPDATE dbo.UsuarioPaciente
			SET PasswordHash = @hash, 
			    PasswordResetSecret = NULL, 
			    PasswordResetExpiresAt = NULL, 
			    LoginAttempts = 0,
			    LockedUntil = NULL,
			    UpdatedAt = SYSUTCDATETIME()
			WHERE Id = @id
		`);

    if (user.CorreoPaciente) {
      await sendPasswordChangeNotification(activeClientId, user.CorreoPaciente);
    }

    return json({
      success: true,
      message: "Contraseña restablecida con éxito. Ya puedes iniciar sesión.",
    });
  } catch (error: any) {
    console.error("❌ [Reset Password Error]:", error.message);
    return json(
      { success: false, message: "Error interno al restablecer la contraseña" },
      { status: 500 },
    );
  }
};
