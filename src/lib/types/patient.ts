export type Patient = {
  id: number;
  name: string;
};

export type PatientCreate = Omit<Patient, "id">;

export type PatientUpdate = Partial<Omit<Patient, "id">>;
