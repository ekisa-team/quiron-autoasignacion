import { apiGet } from "$lib/server/api";
import type { DocumentTypeOption } from "$lib/types/appointments";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

interface DocumentTypeApiRow {
  CodigoDocumento: string;
  NombreDocumento: string;
}

interface BiologicalSexApiRow {
  Codigo: string;
  Nombre: string;
}

export interface BiologicalSexOption {
  value: string;
  label: string;
}

export const load: PageServerLoad = async ({ url, locals }) => {
  const tunnelUrl = locals.tenant?.hclapiUrl;
  if (!tunnelUrl) {
    error(500, "Tunnel url not found");
  }

  const clientId = locals.clientId;
  const initialDoc = url.searchParams.get("doc") || "";
  const initialDocType = url.searchParams.get("docType") || "";
  const fromLogin = url.searchParams.get("fromLogin") === "true";

  try {
    const [docsRes, sexesRes] = await Promise.all([
      apiGet<DocumentTypeApiRow[]>(tunnelUrl, "/lookups/document-types"),
      apiGet<BiologicalSexApiRow[]>(tunnelUrl, "/lookups/biological-sexes"),
    ]);

    const documentTypes: DocumentTypeOption[] = (docsRes || []).map(
      (d: DocumentTypeApiRow) => ({
        value: d.CodigoDocumento,
        label: d.NombreDocumento,
      }),
    );

    const biologicalSexes: BiologicalSexOption[] = (sexesRes || []).map(
      (s: BiologicalSexApiRow) => ({
        value: s.Codigo,
        label: s.Nombre,
      }),
    );

    return {
      documentTypes,
      biologicalSexes,
      clientId,
      initialDoc,
      initialDocType,
      fromLogin,
    };
  } catch (err) {
    error(500, JSON.stringify(err));
  }
};
