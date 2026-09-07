import { apiGet } from "$lib/server/api";
import type { DocumentTypeOption } from "$lib/types/appointments";
import type { PageServerLoad } from "./$types";

interface DocumentTypeApiRow {
  CodigoDocumento?: string;
  codigoDocumento?: string;
  NombreDocumento?: string;
  nombreDocumento?: string;
}

export const load: PageServerLoad = async ({ locals }) => {
  const clientId = locals.clientId || 67;

  try {
    const docs = await apiGet<DocumentTypeApiRow[]>("/lookups/document-types");

    const documentTypes: DocumentTypeOption[] = (docs || [])
      .map((d: DocumentTypeApiRow) => ({
        value: d.CodigoDocumento ?? d.codigoDocumento ?? "",
        label: d.NombreDocumento ?? d.nombreDocumento ?? "",
      }))
      .filter((d: DocumentTypeOption) => d.value !== "");

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
      clientId,
    };
  } catch (error) {
    return {
      documentTypes: [
        { value: "CC", label: "Cédula de Ciudadanía" },
        { value: "TI", label: "Tarjeta de Identidad" },
        { value: "CE", label: "Cédula de Extranjería" },
        { value: "PA", label: "Pasaporte" },
      ],
      clientId,
    };
  }
};
