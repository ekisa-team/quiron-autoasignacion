import { executeQuery } from "$lib/server/db";
import type { DocumentTypeOption } from "$lib/types/appointments";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const clientId = locals.clientId || 67;

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
