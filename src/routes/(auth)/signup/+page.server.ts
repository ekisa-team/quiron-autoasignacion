import { apiGet } from "$lib/server/api";
import type { DocumentTypeOption } from "$lib/types/appointments";
import type { PageServerLoad } from "./$types";

interface DocumentTypeApiRow {
  CodigoDocumento?: string;
  codigoDocumento?: string;
  NombreDocumento?: string;
  nombreDocumento?: string;
}

interface BiologicalSexApiRow {
  codigo?: string;
  Codigo?: string;
  nombre?: string;
  Nombre?: string;
}

export interface BiologicalSexOption {
  value: string;
  label: string;
}

export const load: PageServerLoad = async ({ url, locals }) => {
  const clientId = locals.clientId || 67;
  const initialDoc = url.searchParams.get("doc") || "";
  const initialDocType = url.searchParams.get("docType") || "";
  const fromLogin = url.searchParams.get("fromLogin") === "true";

  try {
    const [docsRes, sexesRes] = await Promise.all([
      apiGet<DocumentTypeApiRow[]>("/lookups/document-types"),
      apiGet<BiologicalSexApiRow[]>("/lookups/biological-sexes"),
    ]);

    const documentTypes: DocumentTypeOption[] = (docsRes || [])
      .map((d: DocumentTypeApiRow) => ({
        value: d.CodigoDocumento ?? d.codigoDocumento ?? "",
        label: d.NombreDocumento ?? d.nombreDocumento ?? "",
      }))
      .filter((d: DocumentTypeOption) => d.value !== "");

    const biologicalSexes: BiologicalSexOption[] = (sexesRes || [])
      .map((s: BiologicalSexApiRow) => ({
        value: s.codigo ?? s.Codigo ?? "",
        label: s.nombre ?? s.Nombre ?? "",
      }))
      .filter((s: BiologicalSexOption) => s.value !== "");

    return {
      documentTypes:
        documentTypes.length > 0
          ? documentTypes
          : [
              { value: "CC", label: "Cédula de Ciudadanía" },
              { value: "TI", label: "Tarjeta de Identidad" },
              { value: "CE", label: "Cédula de Extranjería" },
              { value: "PA", label: "Pasaporte" },
            ],
      biologicalSexes:
        biologicalSexes.length > 0
          ? biologicalSexes
          : [
              { value: "M", label: "Hombre" },
              { value: "F", label: "Mujer" },
            ],
      clientId,
      initialDoc,
      initialDocType,
      fromLogin,
    };
  } catch (error) {
    return {
      documentTypes: [
        { value: "CC", label: "Cédula de Ciudadanía" },
        { value: "TI", label: "Tarjeta de Identidad" },
        { value: "CE", label: "Cédula de Extranjería" },
        { value: "PA", label: "Pasaporte" },
      ],
      biologicalSexes: [
        { value: "M", label: "Hombre" },
        { value: "F", label: "Mujer" },
      ],
      clientId,
      initialDoc,
      initialDocType,
      fromLogin,
    };
  }
};
