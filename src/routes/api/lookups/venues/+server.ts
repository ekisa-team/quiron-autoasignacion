import { executeProcedure } from "$lib/server/db";
import { json, type RequestHandler } from "@sveltejs/kit";
import mssql from "mssql";

export const GET: RequestHandler = async ({ locals }) => {
  try {
    const clientId = locals.clientId || 67;
    const sedes = await executeProcedure(
      clientId,
      "Proc_Autoasignacion_ConsultarSedes",
      {
        IdCliente: { type: mssql.Int, value: clientId },
      },
    );
    return json(sedes || []);
  } catch (error) {
    console.error("[API Sedes Error]:", error);
    return json([], { status: 500 });
  }
};
