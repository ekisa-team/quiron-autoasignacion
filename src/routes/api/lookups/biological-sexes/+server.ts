import { apiGet } from "$lib/server/api";
import { json, type RequestHandler } from "@sveltejs/kit";

interface SexRow {
  codigo?: string;
  Codigo?: string;
  nombre?: string;
  Nombre?: string;
}

export const GET: RequestHandler = async ({ locals }) => {
  try {
    const sexes = await apiGet<SexRow[]>("/lookups/biological-sexes");
    return json(sexes || []);
  } catch {
    return json([], { status: 500 });
  }
};
