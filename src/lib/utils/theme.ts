import type { TenantTheme } from "$lib/types/tenant";

export function generateCssVariables(theme?: TenantTheme): string {
  if (!theme?.variables || Object.keys(theme.variables).length === 0) {
    return "";
  }

  const cssProperties = Object.entries(theme.variables)
    .map(([key, value]) => `${key}: ${value} !important;`)
    .join(" ");

  return `:root:root { ${cssProperties} }`;
}
