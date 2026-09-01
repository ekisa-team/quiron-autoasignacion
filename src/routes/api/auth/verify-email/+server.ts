import { getTenantDb } from "$lib/server/db";
import { json, type RequestHandler } from "@sveltejs/kit";
import mssql from "mssql";

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const { token, clientId } = await request.json();
    const activeClientId = Number(clientId) || locals.clientId;

    if (!token) {
      return json(
        { success: false, message: "Token requerido" },
        { status: 400 },
      );
    }

    const pool = await getTenantDb(activeClientId);
    const req = pool.request();
    req.input("token", mssql.VarChar, token);
    req.input("clientId", mssql.Int, activeClientId);

    const result = await req.query(`
			SELECT TOP 1 Id, EmailVerificationExpiresAt
			FROM dbo.UsuarioPaciente
			WHERE EmailVerificationToken = @token AND ClientId = @clientId
		`);

    const user = result.recordset[0];
    if (!user) {
      return json(
        { success: false, message: "Enlace de verificación inválido" },
        { status: 404 },
      );
    }

    if (
      user.EmailVerificationExpiresAt &&
      new Date(user.EmailVerificationExpiresAt) < new Date()
    ) {
      return json(
        { success: false, message: "El enlace de verificación ha expirado" },
        { status: 410 },
      );
    }

    const updateReq = pool.request();
    updateReq.input("id", mssql.Int, user.Id);
    await updateReq.query(`
			UPDATE dbo.UsuarioPaciente 
			SET EmailVerified = 1, EmailVerificationToken = NULL, EmailVerificationExpiresAt = NULL, UpdatedAt = GETUTCDATE() 
			WHERE Id = @id
		`);

    return json({ success: true, message: "Correo verificado exitosamente" });
  } catch (error) {
    return json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 },
    );
  }
};
