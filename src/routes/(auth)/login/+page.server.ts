import { apiGet } from "$lib/server/api";
import type { DocumentTypeOption } from "$lib/types/appointments";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

interface DocumentTypeApiRow {
  CodigoDocumento: string;
  NombreDocumento: string;
}

export const load: PageServerLoad = async ({ locals }) => {
  const clientId = locals.clientId;
  const tunnelUrl = locals.tenant?.esquemaUrl;

  if (!tunnelUrl) {
    throw new Error("Tunnel URL not found");
  }

  try {
    const docs = await apiGet<DocumentTypeApiRow[]>(
      tunnelUrl,
      "/lookups/document-types",
    );

    const documentTypes: DocumentTypeOption[] = (docs || []).map(
      (d: DocumentTypeApiRow) => ({
        value: d.CodigoDocumento,
        label: d.NombreDocumento,
      }),
    );

    return {
      documentTypes,
      clientId,
    };
  } catch (err) {
    error(500, JSON.stringify(err));
  }
};
