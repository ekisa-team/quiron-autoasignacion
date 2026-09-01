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
    }
  }
}

export {};
