import { executeQuery } from "$lib/server/db";
import type { DocumentTypeOption } from "$lib/types/appointments";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url, locals }) => {
  const clientId = locals.clientId || 67;
  const initialDoc = url.searchParams.get("doc") || "";
  const initialDocType = url.searchParams.get("docType") || "";
  const fromLogin = url.searchParams.get("fromLogin") === "true";

  try {
    const docs = await executeQuery<{
      codigoDocumento: string;
      nombreDocumento: string;
    }>(
      clientId,
      `SELECT codigoDocumento, nombreDocumento 
			 FROM dbo.TiposDocumento 
			 WHERE Proceso = 'PAC' 
			 ORDER BY orden ASC`,
    );

    const documentTypes: DocumentTypeOption[] = docs.map((d) => ({
      value: d.codigoDocumento,
      label: d.nombreDocumento,
    }));

    return {
      documentTypes,
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
      clientId,
      initialDoc,
      initialDocType,
      fromLogin,
    };
  }
};
