import { executeProcedure } from "$lib/server/db";
import { json, type RequestHandler } from "@sveltejs/kit";
import mssql from "mssql";

export const PUT: RequestHandler = async ({ params, locals }) => {
  try {
    const appointmentKey = Number(params.appointmentKey);
    const clientId = locals.clientId || 67;

    if (!appointmentKey) {
      return json(
        { success: false, message: "Clave de cita inválida" },
        { status: 400 },
      );
    }

    await executeProcedure(clientId, "Proc_Aut_CancelarCita", {
      ClaveCita: { type: mssql.Int, value: appointmentKey },
    });

    return json({ success: true, message: "Cita cancelada correctamente" });
  } catch (error) {
    console.error("[API Cancel Appointment Error]:", error);
    return json(
      { success: false, message: "Error al cancelar la cita" },
      { status: 500 },
    );
  }
};
