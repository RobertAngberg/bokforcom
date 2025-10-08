export type WizardStep = "checklista" | "bokningar" | "resultat" | "färdigställ";

export interface KontosaldoRad {
  kontonummer: string;
  beskrivning: string;
  kontoklass: string | null;
  saldo: number;
  antalTransaktioner: number;
}

export interface TransaktionsPost {
  kontonummer: string;
  beskrivning: string | null;
  debet: number;
  kredit: number;
}

export interface TransaktionOverview {
  id: number;
  datum: string;
  beskrivning: string | null;
  belopp: number;
  kommentar: string | null;
  fil: string | null;
  transaktionsposter: TransaktionsPost[];
}

export interface ChecklistItem {
  uppgift: string;
  klar: boolean;
}

export interface PeriodiseringarState {
  förutbetaldaIntäkter: boolean;
  förutbetaldaIntäkterBelopp: number;
  upplupnaKostnader: boolean;
  upplupnaKostnaderBelopp: number;
}

export interface BokslutFormState {
  bokslutstyp: "manuellt" | "konsult";
  avskrivningar: boolean;
  periodiseringar: PeriodiseringarState;
  åretsBokfört: boolean;
}

export interface NEBilagaResult {
  ar: number;
  neBilaga: Record<string, number>;
  genererad: string;
}
