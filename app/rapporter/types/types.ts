// Shared types for rapporter module

// ===== DATABASE/RAW DATA TYPES =====

// Raw transaction data från database (används överallt)
export type TransaktionsPost = {
  id: number;
  transaktions_id: number;
  konto_id: number;
  kontonummer: string;
  kontobeskrivning: string;
  debet: number;
  kredit: number;
  transaktionsdatum: string;
  kontobeskrivning_transaktion: string;
  ar_oppningsbalans: boolean;
};

// Company profile data
export type Foretagsprofil = {
  företagsnamn: string;
  organisationsnummer: string;
};

// Transaction type for momsValidation.ts
export type Transaction = {
  transaktions_id: number;
  transaktionsdatum: string;
  kontobeskrivning: string;
  kommentar: string;
  belopp: number;
};

// Common transaction type (används i vissa komponenter)
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
export type ResultatTransaktion = {
  id: string;
  datum: string;
  belopp: number;
  beskrivning: string;
  transaktion_id: number;
  verifikatNummer: string;
};

export type ResultatKonto = {
  kontonummer: string;
  beskrivning: string;
  transaktioner: ResultatTransaktion[];
  [year: string]: number | string | ResultatTransaktion[] | undefined;
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

// Balansrapport UI types
export interface TabellRad {
  id: string;
  kontonummer?: string;
  beskrivning: string;
  ingaendeSaldo?: number;
  aretsResultat?: number;
  utgaendeSaldo?: number;
  datum?: string;
  belopp?: number;
  verifikatNummer?: string;
  transaktion_id?: number;
  isTransaction?: boolean;
  isSummary?: boolean;
}

export interface VerifikatRad {
  id: string;
  datum: string;
  beskrivning: string;
  debet: number;
  kredit: number;
  saldo: number;
}

export interface KontoTransRad {
  id: string;
  datum: string;
  beskrivning: string;
  belopp: number;
  verifikatNummer?: string;
  transaktion_id?: number;
}

// Momsrapport Status types
export type MomsrapportStatus = "öppen" | "granskad" | "deklarerad" | "betald" | "stängd";

export interface MomsrapportStatusData {
  id: number;
  user_id: string;
  year: number;
  period: string;
  status: MomsrapportStatus;
  granskad_datum: Date | null;
  deklarerad_datum: Date | null;
  betald_datum: Date | null;
  moms_att_betala: number | null;
  ocr_nummer: string | null;
  betalningsreferens: string | null;
  xml_genererad: boolean;
  xml_genererad_datum: Date | null;
  noteringar: string | null;
  created_at: Date;
  updated_at: Date;
}

// Moms Validation types
export interface VerifikatValidation {
  transaktions_id: number;
  transaktionsdatum: string;
  kontobeskrivning: string;
  kommentar: string | null;
  belopp: number;
  varningar: string[];
  status: "ok" | "varning" | "fel";
}

export interface ValidationResult {
  success: boolean;
  totalVerifikat: number;
  verifikatMedVarningar: number;
  verifikat: VerifikatValidation[];
  error?: string;
}

// Bokföringspost för momsBokforing.ts (används för beräkningar från DB)
export type BokforingsPost = {
  kontonummer: string;
  debet: number;
  kredit: number;
};

// Bokföringspost för useMomsWizard.ts (används för UI display)
export type BokforingsPostWizard = {
  konto: string;
  kontonamn: string;
  debet: number;
  kredit: number;
};

// Momskontosaldo för momsBokforing.ts
export type MomskontosaldoRow = {
  kontonummer: string;
  beskrivning: string;
  total_kredit: string;
  total_debet: string;
};

// Component Props types
export interface MomsWizardProps {
  isOpen: boolean;
  onClose: () => void;
  year: string;
  period: string;
  momsData: MomsRad[];
  organisationsnummer: string;
  onExportXML: () => void;
  // Wizard state från parent hook
  currentStep: number;
  validationResult: ValidationResult | null;
  isValidating: boolean;
  hideOkVerifikat: boolean;
  isBokforing: boolean;
  bokforingSuccess: boolean;
  momsAttBetala: number;
  bokforingsposter: BokforingsPostWizard[];
  setCurrentStep: (step: number) => void;
  setHideOkVerifikat: (hide: boolean) => void;
  handleBokfor: () => Promise<void>;
  handleStepComplete: () => Promise<void>;
}

// Hook Props types
export type UseHuvudbokProps = {
  data: TransaktionsPost[];
  foretagsprofil: Foretagsprofil;
};

export type UseResultatrapportProps = {
  transaktionsdata: TransaktionsPost[];
  foretagsprofil: Foretagsprofil;
};

export type UseBalansrapportProps = {
  data: TransaktionsPost[];
  foretagsprofil: Foretagsprofil;
};

export type UseMomsrapportProps = {
  transaktionsdata: TransaktionsPost[];
  foretagsprofil: Foretagsprofil;
};

// Component Props types
export type HuvudbokProps = {
  data: TransaktionsPost[];
  foretagsprofil: Foretagsprofil;
};

export type ResultatrapportProps = {
  transaktionsdata: TransaktionsPost[];
  foretagsprofil: Foretagsprofil;
};

export type BalansrapportProps = {
  data: TransaktionsPost[];
  foretagsprofil: Foretagsprofil;
};

export type MomsrapportProps = {
  transaktionsdata: TransaktionsPost[];
  foretagsprofil: Foretagsprofil;
};

export type RapporterClientProps = {
  initialData: TransaktionsPost[];
  foretagsprofil: Foretagsprofil;
};
