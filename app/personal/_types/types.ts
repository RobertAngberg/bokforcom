// Centraliserade types för personal-modulen

// Extrarad-relaterade types
export interface ExtraradData {
  lönespecifikation_id: number;
  typ: string;
  kolumn1?: string | null;
  kolumn2?: string | null;
  kolumn3?: string | null;
  kolumn4?: string | null;
}

export interface ExtraradResult {
  success: boolean;
  data?: any;
  error?: string;
}

// Utläggs-relaterade types
export interface UtläggData {
  id: number;
  beskrivning: string;
  belopp: number;
  kommentar?: string;
  datum: string;
}

// Lönekörnings-relaterade types
export interface Lönekörning {
  id: number;
  period: string; // "2024-08"
  status: "pågående" | "avslutad" | "pausad" | "avbruten";
  startad_av: number;
  startad_datum: Date;
  avslutad_datum?: Date;
  bankgiro_exporterad_datum?: Date;
  mailade_datum?: Date;
  bokford_datum?: Date;
  agi_genererad_datum?: Date;
  skatter_bokforda_datum?: Date;
  antal_anstallda?: number;
  total_bruttolön?: number;
  total_skatt?: number;
  total_sociala_avgifter?: number;
  total_nettolön?: number;
  kommentar?: string;
  skapad: Date;
  uppdaterad: Date;
  aktuellt_steg: number; // 1=maila, 2=bokför, 3=agi, 4=skatter, 5=komplett
}

// Lönespecifikation med lönekörning
export interface LönespecifikationMedLönekörning {
  id: number;
  anställd_id: number;
  grundlön: number;
  bruttolön: number;
  skatt: number;
  sociala_avgifter: number;
  nettolön: number;
  skapad: Date;
  uppdaterad: Date;
  skapad_av: number;
  utbetalningsdatum: Date;
  status: string;
  bankgiro_exporterad: boolean;
  bankgiro_exporterad_datum?: Date;
  mailad: boolean;
  mailad_datum?: Date;
  bokförd: boolean;
  bokförd_datum?: Date;
  agi_genererad: boolean;
  agi_genererad_datum?: Date;
  skatter_bokförda: boolean;
  skatter_bokförda_datum?: Date;
  lönekorning_id?: number; // Koppling till lönekörning
}

// Anställd-relaterade types
export type AnställdData = {
  förnamn: string;
  efternamn: string;
  personnummer: string;
  jobbtitel: string;
  mail: string;
  clearingnummer: string;
  bankkonto: string;
  adress: string;
  postnummer: string;
  ort: string;
  startdatum: string;
  slutdatum: string;
  anställningstyp: string;
  löneperiod: string;
  ersättningPer: string;
  kompensation: string;
  arbetsvecka: string;
  arbetsbelastning: string;
  deltidProcent: string;
  tjänsteställeAdress: string;
  tjänsteställeOrt: string;
  skattetabell: string;
  skattekolumn: string;
};

// Bokförings-relaterade types
export interface BokföringsPost {
  konto: string;
  kontoNamn: string;
  debet: number;
  kredit: number;
  beskrivning: string;
}

export interface BokförLöneUtbetalningData {
  lönespecId: number;
  extrarader: any[];
  beräknadeVärden: any;
  anställdNamn: string;
  period: string;
  utbetalningsdatum: string;
  kommentar?: string;
  bokföringsPoster?: BokföringsPost[];
}
