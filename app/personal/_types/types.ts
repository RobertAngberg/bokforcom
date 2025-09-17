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

export interface UtläggData {
  id: number;
  beskrivning: string;
  belopp: number;
  kommentar?: string;
  datum: string;
}

export interface Lönekörning {
  id: number;
  period: string;
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
  aktuellt_steg: number;
}

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
  lönekorning_id?: number;
}

export type AnställdData = {
  id?: number;
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
  anställningsdatum?: string;
  tjänstegrad?: number;
  arbetsvecka: string;
  arbetsbelastning: string;
  deltidProcent: string;
  tjänsteställeAdress: string;
  tjänsteställeOrt: string;
  skattetabell: string;
  skattekolumn: string;
};

export interface AnställdListItem {
  id: number;
  namn: string;
  epost: string;
  roll?: string;
}

export interface AnställdaListaProps {
  anställda: AnställdListItem[];
  onRedigera?: (id: number) => void;
  onTaBort?: (id: number) => void;
  loadingAnställdId?: number | null;
}

export interface AnställdaRadProps {
  anställd: AnställdListItem;
}

export interface UtlaggBokforModalProps {
  utlägg: UtläggData;
  previewRows: UtlaggBokföringsRad[];
  onClose: () => void;
  onBokför: () => void;
}

export interface UtlaggFlikProps {
  anställd: AnställdData;
}

export interface NyAnställdFormular {
  förnamn: string;
  efternamn: string;
  personnummer: string;
  jobbtitel: string;
  clearingnummer: string;
  bankkonto: string;
  mail: string;
  adress: string;
  postnummer: string;
  ort: string;
  startdatum: Date;
  slutdatum: Date;
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
  växaStöd: boolean;
}

export interface ToastTillstand {
  message: string;
  type: "success" | "error" | "info";
  isVisible: boolean;
}

export interface UtlaggBokföringsRad {
  kontonummer: string;
  beskrivning: string;
  debet: number;
  kredit: number;
}

export interface UtläggBokföringModalState {
  isOpen: boolean;
  utlägg: UtläggData | null;
  previewRows: UtlaggBokföringsRad[];
  loading: boolean;
}

export interface PersonalStoreState {
  anställda: AnställdListItem[];
  valdAnställd: AnställdData | null;
  anställdaLoading: boolean;
  anställdLoading: boolean;
  anställdLoadingId: number | null;
  anställdaError: string | null;
  nyAnställdFormulär: NyAnställdFormular;
  nyAnställdLoading: boolean;
  visaNyAnställdFormulär: boolean;
  toast: ToastTillstand;
  utlägg: UtläggData[];
  utläggLoading: boolean;
  utläggBokföringModal: UtläggBokföringModalState;
  setAnställda: (anställda: AnställdListItem[]) => void;
  setValdAnställd: (anställd: AnställdData | null) => void;
  setAnställdaLoading: (loading: boolean) => void;
  setAnställdLoading: (loading: boolean) => void;
  setAnställdLoadingId: (id: number | null) => void;
  setAnställdaError: (error: string | null) => void;
  addAnställd: (anställd: AnställdListItem) => void;
  removeAnställd: (id: number) => void;
  updateAnställd: (id: number, updatedData: Partial<AnställdListItem>) => void;
  setNyAnställdFormulär: (formulär: NyAnställdFormular) => void;
  updateNyAnställdFormulär: (updates: Partial<NyAnställdFormular>) => void;
  handleSanitizedChange: (e: any) => void;
  resetNyAnställdFormulär: () => void;
  setNyAnställdLoading: (loading: boolean) => void;
  setVisaNyAnställdFormulär: (visa: boolean) => void;
  setToast: (toast: ToastTillstand) => void;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  hideToast: () => void;
  setUtlägg: (utlägg: UtläggData[]) => void;
  setUtläggLoading: (loading: boolean) => void;
  openUtläggBokföringModal: (utlägg: UtläggData, previewRows: UtlaggBokföringsRad[]) => void;
  closeUtläggBokföringModal: () => void;
  setUtläggBokföringLoading: (loading: boolean) => void;
  initStore: (data: {
    anställda?: AnställdListItem[];
    valdAnställd?: AnställdData | null;
    utlägg?: UtläggData[];
  }) => void;
}

export interface StoreInitProps {
  anställda?: AnställdListItem[];
  valdAnställd?: AnställdData | null;
  utlägg?: UtläggData[];
}

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

export interface PersonalinformationProps {
  anställd?: any;
  onRedigera?: () => void;
}

export interface AnställningstypProps {
  viewMode?: boolean;
}

export interface ArbetsbelastningProps {
  viewMode?: boolean;
}

export interface JobbtitelProps {
  editData?: any;
  handleChange?: (name: string, value: any) => void;
  anställd?: any;
  viewMode?: boolean;
}

export interface KontraktProps {
  anställd?: any;
  onRedigera?: () => void;
}

export interface EditData {
  anställningstyp: string;
  startdatum: Date;
  slutdatum: Date;
  månadslön: string;
  betalningssätt: string;
  kompensation: string;
  ersättningPer: string;
  arbetsbelastning: string;
  arbetsveckaTimmar: string;
  deltidProcent: string;
  skattetabell: string;
  skattekolumn: string;
  jobbtitel: string;
  semesterdagarPerÅr: string;
  tjänsteställeAdress: string;
  tjänsteställeOrt: string;
}

export interface KontraktProps {
  anställd?: any;
  onRedigera?: () => void;
}

export interface EditData {
  anställningstyp: string;
  startdatum: Date;
  slutdatum: Date;
  månadslön: string;
  betalningssätt: string;
  kompensation: string;
  ersättningPer: string;
  arbetsbelastning: string;
  arbetsveckaTimmar: string;
  deltidProcent: string;
  skattetabell: string;
  skattekolumn: string;
  jobbtitel: string;
  semesterdagarPerÅr: string;
  tjänsteställeAdress: string;
  tjänsteställeOrt: string;
}
