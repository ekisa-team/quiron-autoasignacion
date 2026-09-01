import { executeProcedure } from "$lib/server/db";
import { json, type RequestHandler } from "@sveltejs/kit";
import mssql from "mssql";

export const GET: RequestHandler = async ({ locals }) => {
  try {
    const clientId = locals.clientId;
    const actividades = await executeProcedure(
      clientId,
      "Proc_Autoasignacion_ConsultarActividadesCitas",
      {
        IdCliente: { type: mssql.Int, value: clientId },
      },
    );
    return json(actividades);
  } catch (error) {
    console.error("[API Actividades Error]:", error);
    return json([], { status: 500 });
  }
};
