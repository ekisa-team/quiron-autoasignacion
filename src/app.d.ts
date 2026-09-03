import type { TenantConfig } from "$lib/types/tenant";

declare global {
  namespace App {
    interface Locals {
      user: {
        userId: string;
        patientId: string;
        patientIdentification: string;
        clientId: string;
        fullName: string;
        email: string;
        phone: string;
        emailVerified: boolean;
      } | null;
      clientId: number;
      tenant?: TenantConfig;
    }
    interface PageData {
      tenant?: TenantConfig;
      tenantCss?: string;
    }
  }
}

export {};
