export type TenantTheme = {
  variables?: Record<string, string>;
  layout?: unknown;
};

export type TenantFeatures = {
  allowOnlinePayments?: boolean;
};

export type TenantContact = {
  emails?: string[];
  phones?: string[];
};

export interface TenantConfig {
  tenantIdentifier: string;
  clientId: number;
  name: string;
  logoUrl?: string;
  theme?: TenantTheme;
  features?: TenantFeatures;
  contact?: TenantContact;
  esquemaUrl?: string;
}
