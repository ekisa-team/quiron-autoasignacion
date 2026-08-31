import { executeProcedure, getTenantDb } from "$lib/server/db";
import { sendPasswordChangeNotification } from "$lib/server/email";
import { hashPassword, verifyPassword } from "$lib/server/password";
import { json, type RequestHandler } from "@sveltejs/kit";
import mssql from "mssql";

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    if (!locals.user) {
      return json(
        { success: false, message: "No autenticado" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;
    const patientId = Number(locals.user.patientId);
    const clientId = Number(locals.user.clientId) || locals.clientId;

    if (!currentPassword || !newPassword) {
      return json(
        { success: false, message: "Todos los campos son requeridos" },
        { status: 400 },
      );
    }

    if (newPassword.length < 6) {
      return json(
        {
          success: false,
          message: "La nueva contraseña debe tener mínimo 6 caracteres",
        },
        { status: 400 },
      );
    }

    const pool = await getTenantDb(clientId);

    const userReq = pool.request();
    userReq.input("patientId", mssql.Int, patientId);
    userReq.input("clientId", mssql.Int, clientId);

    const userRes = await userReq.query(`
			SELECT TOP 1 Id, PasswordHash 
			FROM dbo.UsuarioPaciente 
			WHERE PatientId = @patientId AND ClientId = @clientId
		`);

    const user = userRes.recordset[0];
    if (!user) {
      return json(
        { success: false, message: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    const isCurrentValid = await verifyPassword(
      currentPassword,
      user.PasswordHash,
    );
    if (!isCurrentValid) {
      return json(
        { success: false, message: "La contraseña actual es incorrecta" },
        { status: 400 },
      );
    }

    const newHash = await hashPassword(newPassword);

    await executeProcedure(clientId, "Proc_Aut_CambiarClaveSesion", {
      PatientId: { type: mssql.Int, value: patientId },
      ClientId: { type: mssql.Int, value: clientId },
      NewPasswordHash: { type: mssql.VarChar(255), value: newHash },
    });

    if (locals.user.email) {
      await sendPasswordChangeNotification(clientId, locals.user.email);
    }

    return json({ success: true, message: "Contraseña cambiada exitosamente" });
  } catch (error: any) {
    console.error("[Change Password Error]:", error);
    return json(
      { success: false, message: "Error interno al cambiar la contraseña" },
      { status: 500 },
    );
  }
};
