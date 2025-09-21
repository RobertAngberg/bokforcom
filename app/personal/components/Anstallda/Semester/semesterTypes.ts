// Semester types separated from database implementation to avoid client-side PostgreSQL imports

export interface SemesterSummary {
  betalda_dagar: number;
  sparade_dagar: number;
  skuld: number;
  komp_dagar: number;
}

export interface SemesterRecord {
  id?: number;
  anställd_id: number;
  datum: string;
  typ: "Förskott" | "Sparade" | "Obetald" | "Betalda" | "Intjänat";
  antal: number;
  från_datum?: string;
  till_datum?: string;
  beskrivning?: string;
  lönespecifikation_id?: number;
  bokfört: boolean;
  skapad_av: number;
}
