import { executeQuery } from "$lib/server/db";
import { json, type RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ locals }) => {
  try {
    const clientId = locals.clientId;
    const festivos = await executeQuery<{ fechaCalendario: Date }>(
      clientId,
      `SELECT fechaCalendario FROM dbo.Festivos`,
    );
    return json(festivos.map((f) => f.fechaCalendario));
  } catch (error) {
    console.error("[API Festivos Error]:", error);
    return json([], { status: 500 });
  }
};
