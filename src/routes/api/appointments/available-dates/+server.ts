import { getTenantDb } from "$lib/server/db";
import { json, type RequestHandler } from "@sveltejs/kit";
import mssql from "mssql";

export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    const clientId = locals.clientId || 67;
    const venueId = Number(url.searchParams.get("venueId")) || 0;
    const serviceId = Number(url.searchParams.get("serviceId")) || 0;

    const pool = await getTenantDb(clientId);
    const req = pool.request();
    req.input("venueId", mssql.Int, venueId);
    req.input("serviceId", mssql.Int, serviceId);
    req.input("clientId", mssql.Int, clientId);

    const result = await req.query<{ availableDate: Date }>(`
			SELECT DISTINCT CONVERT(DATE, Cit.FechaCita) AS availableDate
			FROM dbo.Cit_Agenda Cit
			WHERE (@venueId = 0 OR Cit.IdSede = @venueId)
			  AND (@serviceId = 0 OR Cit.IdServicio = @serviceId)
			  AND Cit.TipoCita = 'PRINCIPAL'
			  AND Cit.EstadoCita = 'DISPONIBLE'
			  AND Cit.IdCliente = @clientId
			  AND Cit.FechaCita >= CONVERT(DATE, GETDATE())
		`);

    const dates = result.recordset
      .map((r) => {
        const d = new Date(r.availableDate);
        return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0];
      })
      .filter(Boolean);

    return json(dates);
  } catch (error) {
    console.error("[API Available Dates Error]:", error);
    return json([]);
  }
};
