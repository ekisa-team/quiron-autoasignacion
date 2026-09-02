import { apiGet } from "$lib/server/api";
import { json, type RequestHandler } from "@sveltejs/kit";

interface ProfessionalRow {
  IdProfesional?: number;
  idProfesional?: number;
  NombreProfesional?: string;
  nombreProfesional?: string;
}

export const GET: RequestHandler = async ({ locals }) => {
  try {
    const clientId = locals.clientId || 67;
    const professionals = await apiGet<ProfessionalRow[]>("/profesionales", {
      id_cliente: clientId,
    });
    return json(professionals || []);
  } catch (error) {
    return json([], { status: 500 });
  }
};
