import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url, locals }) => {
  const token = url.searchParams.get("t") || "";
  const clientId = Number(url.searchParams.get("c")) || locals.clientId;
  const identification = url.searchParams.get("i") || "";

  return {
    token,
    clientId,
    identification,
  };
};
