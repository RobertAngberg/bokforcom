// SIE Import Types

// ============================================================================
// Core SIE Data Structure
// ============================================================================

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

// ============================================================================
// Encoding & Parsing Types
// ============================================================================

export type SieDiagnosticEntry = {
  message: string;
  data?: unknown;
};

export interface DecodeSieFileOptions {
  /** When true, gather extra diagnostics such as encoding scores. */
  debug?: boolean;
  /** Encodings to consider when auto-detecting. Defaults to UTF-8, ISO-8859-1, Windows-1252, CP850. */
  encodings?: string[];
}

export interface SieDecodingResult {
  content: string;
  encoding: string;
  formatTag?: string;
  diagnostics: SieDiagnosticEntry[];
}

// ============================================================================
// Database & Transaction Types
// ============================================================================

export interface TransactionRow {
  transaktionsdatum: Date;
  kontonummer: string;
  debet: number;
  kredit: number;
}

export interface TransactionRowForGrouping {
  transaktion_id: number;
  transaktionsdatum: Date;
  kommentar?: string;
  kontobeskrivning?: string;
  kontonummer: string;
  debet: number;
  kredit: number;
}

export interface BalansPost {
  konto: string;
  belopp: number;
}

// ============================================================================
// Verification Types
// ============================================================================

export interface Verification {
  serie: string;
  nummer: string;
  datum: string;
  beskrivning: string;
  transaktioner: Transaction[];
}

export interface VerificationForExport {
  nummer: number;
  datum: string;
  beskrivning: string;
  poster: Array<{
    konto: string;
    belopp: number;
  }>;
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

// ============================================================================
// Company & Account Types
// ============================================================================

export interface CompanyInfo {
  företagsnamn?: string;
  email?: string;
  organisationsnummer?: string;
}

export interface AccountInfo {
  kontonummer: string;
  beskrivning: string;
}

export interface KontoRow {
  kontonummer: string;
  beskrivning?: string;
}

export interface DuplicateAccount {
  kontonummer: string;
  antal: number;
  ids: number[];
}

// ============================================================================
// Import & File Types
// ============================================================================

export interface FileInfo {
  filnamn: string;
  filstorlek: number;
}

export interface Analys {
  totaltAntal: number;
  standardKonton: number;
  specialKonton: number;
  kritiskaKonton: string[];
  anvandaSaknade: number;
  totaltAnvanda: number;
}

export interface SieUploadResult {
  success: boolean;
  data?: SieData;
  saknade?: string[];
  analys?: Analys;
  error?: string;
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

// ============================================================================
// UI & Wizard Types
// ============================================================================

export interface ImportWizardProps {
  sieData: SieData;
  saknadeKonton: string[];
  analys: Analys;
  onCancel: () => void;
  selectedFile?: File | null;
}

export type WizardStep = "konton" | "inställningar" | "förhandsvisning" | "import" | "resultat";
