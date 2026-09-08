import { generateCssVariables } from "$lib/utils/theme";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals }) => {
  return {
    user: locals.user,
    clientId: locals.clientId,
    tenant: locals.tenant,
    tenantCss: generateCssVariables(locals.tenant?.theme),
  };
};
