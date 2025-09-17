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
  editData?: any;
  handleChange?: (name: string, value: any) => void;
  anställd?: any;
  viewMode?: boolean;
  options?: { value: string; label: string }[];
}

export interface ArbetsbelastningProps {
  editData?: any;
  handleChange?: (name: string, value: any) => void;
  anställd?: any;
  viewMode?: boolean;
  options?: { value: string; label: string }[];
  display?: {
    arbetsbelastningText: string;
    arbetsveckaText: string;
  };
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

export interface KontraktPeriodProps {
  editData?: any;
  handleChange?: (name: string, value: any) => void;
  anställd?: any;
  viewMode?: boolean;
}

export interface LönProps {
  editData?: any;
  handleChange?: (name: string, value: any) => void;
  anställd?: any;
  viewMode?: boolean;
  options?: {
    ersättningPer: { value: string; label: string }[];
  };
}

export interface SemesterProps {
  editData?: any;
  handleChange?: (name: string, value: any) => void;
  anställd?: any;
  viewMode?: boolean;
}

export interface SkattProps {
  editData?: any;
  handleChange?: (name: string, value: any) => void;
  anställd?: any;
  viewMode?: boolean;
  options?: {
    skattetabell: { value: string; label: string }[];
    skattekolumn: { value: string; label: string }[];
  };
}

export interface TjänsteställeProps {
  editData?: any;
  handleChange?: (name: string, value: any) => void;
  anställd?: any;
  viewMode?: boolean;
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

// ===============================
// Lönekörning: komponent-props
// ===============================
export interface AGIDebugModalProps {
  visaDebug: boolean;
  setVisaDebug: (show: boolean) => void;
  agiDebugData: any;
}

export interface AGIGeneratorProps {
  valdaSpecar: any[];
  anstallda: any[];
  beräknadeVärden: any;
  extrarader: any;
  utbetalningsdatum: string | null;
  session: any;
  hämtaFöretagsprofil: (userId: string) => Promise<any>;
  onAGIComplete?: () => void; // Callback för när AGI är genererad
}

export interface BankgiroExportProps {
  anställda: any[];
  utbetalningsdatum: Date | null;
  lönespecar: Record<string, any>;
  open?: boolean;
  onClose?: () => void;
  onExportComplete?: () => void; // Callback när export är klar
  showButton?: boolean; // Om knappen ska visas
  direktNedladdning?: boolean; // Om nedladdning ska ske direkt
}

export interface BokförProps {
  anställda: any[];
  utbetalningsdatum?: Date | null;
  lönespecar: Record<string, any>;
}

export interface LöneKnapparProps {
  lönespec: any;
  anställd: any;
  företagsprofil: any;
  extrarader: any[];
  beräknadeVärden: any;
  onForhandsgranskning: (id: string) => void;
  onTaBortLönespec: () => void;
  taBortLoading: boolean;
}

export interface LöneBatchKnapparProps {
  lönespecar: any[];
  anställda: any[];
  företagsprofil: any;
  extrarader: any[];
  beräknadeVärden: any;
  onMaila: () => void;
  onBankgiroClick: () => void;
  onBokförClick: () => void;
}

export interface LönedatumProps {
  utbetalningsdatum: Date | null;
  setUtbetalningsdatum: (date: Date | null) => void;
}

export interface LonekorningListaProps {
  onValjLonekorning: (lonekorning: Lönekörning) => void;
  valdLonekorning?: Lönekörning | null;
  refreshTrigger?: number;
}

export interface LonespecListaProps {
  valdaSpecar: any[];
  anstallda: any[];
  utlaggMap: Record<number, any[]>;
  lönekörning?: any;
  onTaBortSpec: (specId: number) => Promise<void>;
  onHämtaBankgiro: () => void;
  onMailaSpecar: () => void;
  onBokför: () => void;
  onGenereraAGI: () => void;
  onBokförSkatter: () => void;
  onRefreshData?: () => Promise<void>;
  period?: string;
}

export interface LonespecManagerProps {
  valdaSpecar: any[];
  setValdaSpecar: (value: any[] | ((prev: any[]) => any[])) => void;
  specarPerDatum: any;
  setSpecarPerDatum: (value: any | ((prev: any) => any)) => void;
  datumLista: string[];
  setDatumLista: (value: string[] | ((prev: string[]) => string[])) => void;
  utbetalningsdatum: string | null;
  setUtbetalningsdatum: (value: string | null) => void;
}

export interface NyLonekorningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLonekorningCreated: (lonekorning: any) => void;
}

export interface NySpecModalProps {
  isOpen: boolean;
  onClose: () => void;
  nySpecDatum: Date | null;
  setNySpecDatum: (date: Date | null) => void;
  anstallda: Array<{ id: string; [key: string]: any }>;
  onSpecCreated: () => void;
}

export interface SammanfattningProps {
  anställda: any[];
}

export interface UtbetalningsdatumValjareProps {
  datumLista: string[];
  utbetalningsdatum: string | null;
  setUtbetalningsdatum: (datum: string) => void;
  specarPerDatum: Record<string, any[]>;
}

export interface SkatteBokforingModalProps {
  skatteModalOpen: boolean;
  setSkatteModalOpen: (open: boolean) => void;
  valdaSpecar: any[];
  skatteData: any;
  utbetalningsdatum: string | null;
  skatteDatum: Date | null;
  setSkatteDatum: (date: Date | null) => void;
  hanteraBokförSkatter: () => void;
  skatteBokförPågår: boolean;
  onHämtaBankgiro?: () => void;
}

export interface SkatteManagerProps {
  valdaSpecar: any[];
  beräknadeVärden: any;
  skatteDatum: Date | null;
  setSkatteBokförPågår: (loading: boolean) => void;
  setSkatteModalOpen: (open: boolean) => void;
  bokförLöneskatter: (data: any) => Promise<any>;
  onSkatteComplete?: () => void;
}
