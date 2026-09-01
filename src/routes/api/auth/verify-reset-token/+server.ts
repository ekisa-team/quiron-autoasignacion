import { getTenantDb } from "$lib/server/db";
import { json, type RequestHandler } from "@sveltejs/kit";
import mssql from "mssql";

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const { token, identification, clientId } = await request.json();
    const activeClientId = Number(clientId) || locals.clientId;

    if (!token || !identification) {
      return json({ success: false, valid: false });
    }

    const pool = await getTenantDb(activeClientId);
    const req = pool.request();
    req.input("token", mssql.VarChar, token);
    req.input("doc", mssql.VarChar, identification);
    req.input("clientId", mssql.Int, activeClientId);

    const result = await req.query(`
			SELECT TOP 1 u.Id
			FROM dbo.UsuarioPaciente u
			INNER JOIN dbo.Pacientes p ON p.CodigoPaciente = u.PatientId
			WHERE u.PasswordResetSecret = @token 
			  AND p.IdentificacionPaciente = @doc 
			  AND u.ClientId = @clientId
			  AND (u.PasswordResetExpiresAt IS NULL OR u.PasswordResetExpiresAt > GETUTCDATE())
		`);

    return json({ success: true, valid: result.recordset.length > 0 });
  } catch (error) {
    return json({ success: false, valid: false });
  }
};
