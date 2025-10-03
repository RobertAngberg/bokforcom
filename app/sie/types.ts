// SIE Import Types

export interface SieData {
  header: {
    program: string;
    organisationsnummer: string;
    företagsnamn: string;
    räkenskapsår: Array<{ år: number; startdatum: string; slutdatum: string }>;
    kontoplan: string;
  };
  konton: Array<{
    nummer: string;
    namn: string;
  }>;
  verifikationer: Array<{
    serie: string;
    nummer: string;
    datum: string;
    beskrivning: string;
    transaktioner: Array<{
      konto: string;
      belopp: number;
    }>;
  }>;
  balanser: {
    ingående: Array<{ konto: string; belopp: number }>;
    utgående: Array<{ konto: string; belopp: number }>;
  };
  resultat: Array<{ konto: string; belopp: number }>;
}

export interface Analys {
  totaltAntal: number;
  standardKonton: number;
  specialKonton: number;
  kritiskaKonton: string[];
  anvandaSaknade: number;
  totaltAnvanda: number;
}

export interface ImportSettings {
  startDatum: string;
  slutDatum: string;
  inkluderaVerifikationer: boolean;
  inkluderaBalanser: boolean;
  inkluderaResultat: boolean;
  skapaKonton: boolean;
  exkluderaVerifikationer: string[];
}

// Local import settings used in page.tsx components
export type LocalImportSettings = {
  startDatum: string;
  slutDatum: string;
  inkluderaVerifikationer: boolean;
  inkluderaBalanser: boolean;
  inkluderaResultat: boolean;
  skapaKonton: boolean;
  exkluderaVerifikationer: string[];
};

export interface ImportResultat {
  success: boolean;
  skapadeKonton?: number;
  importeradeVerifikationer?: number;
  importeradeBalanser?: number;
  importeradeResultat?: number;
  dubbletter?: number;
  error?: string;
  felmeddelanden?: string[];
}

// Import result structure used in wizard
export type ImportResultatWizard = {
  kontonSkapade: number;
  verifikationerImporterade: number;
  balanserImporterade: number;
  resultatImporterat: number;
};

export interface DublettResultat {
  antalDubbletter: number;
  rensade: number;
  felmeddelanden?: string[];
}

// Dubbletter result used in page.tsx
export type DublettResultatSimple = {
  success: boolean;
  rensade?: number;
  error?: string;
};

export interface KontoRow {
  kontonummer: string;
  beskrivning?: string;
}

export interface Verification {
  serie: string;
  nummer: string;
  datum: string;
  beskrivning: string;
  transaktioner: Transaction[];
}

export interface Transaction {
  konto: string;
  belopp: number;
}

export interface VerificationPost {
  konto: string;
  belopp: number;
  beskrivning?: string;
}

export interface ImportWizardProps {
  sieData: SieData;
  saknadeKonton: string[];
  analys: Analys;
  onCancel: () => void;
  selectedFile?: File | null;
}

export type WizardStep = "konton" | "inställningar" | "förhandsvisning" | "import" | "resultat";
