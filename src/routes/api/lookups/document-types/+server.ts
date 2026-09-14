import { apiGet } from "$lib/server/api";
import { error, json, type RequestHandler } from "@sveltejs/kit";

interface DocumentTypeRow {
  CodigoDocumento: string;
  NombreDocumento: string;
  Proceso: string;
  Orden: number;
}

export const GET: RequestHandler = async ({ locals }) => {
  try {
    const clientId = locals.clientId;
    const tunnelUrl = locals.tenant?.apirUrl;
    if (!tunnelUrl) {
      error(500, "Tunnel url not found");
    }

    const docs = await apiGet<DocumentTypeRow[]>(
      tunnelUrl,
      "/lookups/document-types",
      {
        id_cliente: clientId,
      },
    );

    return json(docs || []);
  } catch (err) {
    error(500, JSON.stringify(err));
  }
};
