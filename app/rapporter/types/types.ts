// Shared types for rapporter module

// Common transaction type
export type Transaktion = {
  id: string;
  datum: string | Date;
  belopp: number;
  beskrivning?: string;
  transaktion_id?: number;
  verifikatNummer?: string;
};

// Basic balance account type for raw data
export type BasicBalanceAccount = {
  kontonummer: string;
  beskrivning: string;
  saldo: number;
  transaktioner?: Transaktion[];
};

// Balansrapport types
export type Konto = {
  kontonummer: string;
  beskrivning: string;
  ingaendeSaldo: number;
  aretsResultat: number;
  utgaendeSaldo: number;
  transaktioner: Transaktion[];
};

export type BalansData = {
  year: string;
  ingaendeTillgangar: BasicBalanceAccount[];
  aretsTillgangar: BasicBalanceAccount[];
  utgaendeTillgangar: BasicBalanceAccount[];
  ingaendeSkulder: BasicBalanceAccount[];
  aretsSkulder: BasicBalanceAccount[];
  utgaendeSkulder: BasicBalanceAccount[];
  ingaendeResultat: number;
  aretsResultat: number;
  utgaendeResultat: number;
};

// Momsrapport types
export type MomsRad = {
  fält: string;
  beskrivning: string;
  belopp: number;
};

// Huvudbok types
export type TransaktionData = {
  transaktion_id: number;
  datum: string;
  beskrivning: string;
  debet: number | null;
  kredit: number | null;
  verifikatNummer: string;
  belopp: number;
  lopande_saldo: number;
  sort_priority: number;
};

export type HuvudboksKontoMedTransaktioner = {
  kontonummer: string;
  beskrivning: string;
  ingaendeBalans: number;
  utgaendeBalans: number;
  transaktioner: TransaktionData[];
};

// Resultatrapport types
export type ResultatKonto = {
  kontonummer: string;
  beskrivning: string;
  transaktioner?: Array<{
    id: string;
    datum: string;
    belopp: number;
    beskrivning: string;
    transaktion_id: number;
    verifikatNummer: string;
  }>;
  [year: string]:
    | number
    | string
    | undefined
    | Array<{
        id: string;
        datum: string;
        belopp: number;
        beskrivning: string;
        transaktion_id: number;
        verifikatNummer: string;
      }>;
};

export type KontoRad = {
  namn: string;
  konton: ResultatKonto[];
  summering: { [year: string]: number };
};

export type ResultatData = {
  intakter: KontoRad[];
  rorelsensKostnader: KontoRad[];
  finansiellaIntakter?: KontoRad[];
  finansiellaKostnader: KontoRad[];
  ar: string[];
};

// Common utility types
export type ExportMessage = {
  type: "success" | "error";
  text: string;
} | null;

export type ToastState = {
  type: "success" | "error" | "info";
  message: string;
} | null;

// Verifikat types
export type Verifikation = {
  id: string;
  datum: string;
  beskrivning: string;
  debet: number;
  kredit: number;
  saldo: number;
};
