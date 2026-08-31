import { getTenantDb } from "$lib/server/db";
import { sendPasswordResetEmail } from "$lib/server/email";
import { generateSecureToken } from "$lib/server/password";
import { verifyTurnstileToken } from "$lib/server/turnstile";
import { json, type RequestHandler } from "@sveltejs/kit";
import mssql from "mssql";

export const POST: RequestHandler = async ({
  request,
  locals,
  getClientAddress,
}) => {
  try {
    const body = await request.json();
    const { documentType, identification, email, captchaToken } = body;
    const clientId = Number(body.clientId) || locals.clientId || 67;

    if (captchaToken) {
      const isCaptchaValid = await verifyTurnstileToken(
        captchaToken,
        getClientAddress(),
      );
      if (!isCaptchaValid) {
        return json(
          { success: false, message: "Verificación de seguridad fallida" },
          { status: 400 },
        );
      }
    }

    if (!documentType || !identification || !email) {
      return json(
        { success: false, message: "Todos los campos son requeridos" },
        { status: 400 },
      );
    }

    const pool = await getTenantDb(clientId);

    const patReq = pool.request();
    patReq.input("doc", mssql.VarChar(20), String(identification).trim());
    patReq.input("docType", mssql.VarChar(2), String(documentType).trim());
    patReq.input(
      "email",
      mssql.VarChar(50),
      String(email).trim().toLowerCase(),
    );
    patReq.input("clientId", mssql.Int, clientId);

    const patRes = await patReq.query(`
			SELECT TOP 1 CodigoPaciente, IdentificacionPaciente, CorreoPaciente
			FROM dbo.Pacientes
			WHERE IdentificacionPaciente = @doc 
			  AND CodigoTipoDocumento = @docType
			  AND CorreoPaciente = @email 
			  AND IdCliente = @clientId
		`);

    const patient = patRes.recordset[0];

    if (!patient) {
      console.warn(
        `⚠️ [Forgot Password] No se encontró ningún paciente con esos 3 datos en la BD del cliente ${clientId}`,
      );
    } else {
      const userReq = pool.request();
      userReq.input("patientId", mssql.Int, patient.CodigoPaciente);
      userReq.input("clientId", mssql.Int, clientId);

      const userRes = await userReq.query(`
				SELECT TOP 1 Id FROM dbo.UsuarioPaciente WHERE PatientId = @patientId AND ClientId = @clientId
			`);

      if (userRes.recordset.length === 0) {
        console.warn(
          `⚠️ [Forgot Password] El paciente existe en dbo.Pacientes pero NO tiene registro en dbo.UsuarioPaciente`,
        );
      } else {
        const resetToken = generateSecureToken(32);

        const updateReq = pool.request();
        updateReq.input("patientId", mssql.Int, patient.CodigoPaciente);
        updateReq.input("clientId", mssql.Int, clientId);
        updateReq.input("token", mssql.VarChar(255), resetToken);

        await updateReq.query(`
					UPDATE dbo.UsuarioPaciente
					SET PasswordResetSecret = @token, 
					    PasswordResetExpiresAt = DATEADD(hour, 1, SYSUTCDATETIME()), 
					    UpdatedAt = SYSUTCDATETIME()
					WHERE PatientId = @patientId AND ClientId = @clientId
				`);
        await sendPasswordResetEmail(
          clientId,
          patient.CorreoPaciente,
          patient.IdentificacionPaciente,
          resetToken,
        );
      }
    }

    return json({
      success: true,
      message:
        "Si los datos coinciden con una cuenta registrada, recibirás un enlace de recuperación en tu correo.",
    });
  } catch (error: any) {
    console.error("❌ [Forgot Password Error]:", error.message);
    return json({
      success: true,
      message:
        "Si los datos coinciden con una cuenta registrada, recibirás un enlace de recuperación en tu correo.",
    });
  }
};
