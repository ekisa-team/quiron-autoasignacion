import { AsyncLocalStorage } from "node:async_hooks";

export interface TenantContextStore {
  hclapiUrl?: string;
  clientId?: number;
  tenantIdentifier?: string;
}

export const tenantContext = new AsyncLocalStorage<TenantContextStore>();
