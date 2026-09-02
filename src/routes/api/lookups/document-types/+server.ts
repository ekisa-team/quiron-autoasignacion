import { apiGet } from "$lib/server/api";
import { json, type RequestHandler } from "@sveltejs/kit";

interface DocumentTypeRow {
  codigoDocumento?: string;
  CodigoDocumento?: string;
  nombreDocumento?: string;
  NombreDocumento?: string;
  proceso?: string;
  orden?: number;
}

export const GET: RequestHandler = async ({ locals }) => {
  try {
    const clientId = locals.clientId || 67;
    const docs = await apiGet<DocumentTypeRow[]>("/lookups/document-types", {
      id_cliente: clientId,
    });
    return json(docs || []);
  } catch (error) {
    return json([], { status: 500 });
  }
};
