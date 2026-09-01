import { executeProcedure } from "$lib/server/db";
import { json, type RequestHandler } from "@sveltejs/kit";
import mssql from "mssql";

export const GET: RequestHandler = async ({ locals }) => {
  try {
    const clientId = locals.clientId;
    const profesionales = await executeProcedure(
      clientId,
      "Proc_Autoasignacion_ConsultarProfesionales",
      {
        IdCliente: { type: mssql.Int, value: clientId },
      },
    );
    return json(profesionales);
  } catch (error) {
    console.error("[API Profesionales Error]:", error);
    return json([], { status: 500 });
  }
};
