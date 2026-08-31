import { executeQuery } from "$lib/server/db";
import { json, type RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ locals }) => {
  try {
    const clientId = locals.clientId;
    const docs = await executeQuery<{
      codigoDocumento: string;
      nombreDocumento: string;
      proceso: string;
      orden: number;
    }>(
      clientId,
      `SELECT codigoDocumento, nombreDocumento, proceso, orden 
			 FROM dbo.TiposDocumento 
			 WHERE Proceso = 'PAC' 
			 ORDER BY orden ASC`,
    );
    return json(docs);
  } catch (error) {
    console.error("[API TiposDocumento Error]:", error);
    return json([], { status: 500 });
  }
};
