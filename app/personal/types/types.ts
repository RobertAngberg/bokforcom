// === SEMESTER TYPES ===
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
  skapad_av: string; // Uppdaterat för Better Auth UUID
}

export interface SemesterSummary {
  betalda_dagar: number;
  sparade_dagar: number;
  skuld: number;
  komp_dagar: number;
}

// === EXTRARAD TYPES ===
export interface ExtraradData {
  id?: number;
  lönespecifikation_id: number;
  typ: string;
  kolumn1?: string | null;
  kolumn2?: string | null;
  kolumn3?: string | null;
  kolumn4?: string | null;
  enhet?: string;
  modalFields?: ModalFields;
}

export interface ExtraradResult {
  success: boolean;
  data?: ExtraradData;
  error?: string;
}

export interface ModalFields {
  kolumn1?: string | null;
  kolumn2?: string | null;
  kolumn3?: string | null;
  kolumn4?: string | null;
  enhet?: string;
}

export interface UtläggData {
  id: number;
  beskrivning: string;
  belopp: number;
  kommentar?: string;
  datum: string;
  anställd_id?: number;
  user_id?: number;
  status?: string;
  skapad?: string | Date;
  uppdaterad?: string | Date;
  transaktion_id?: number | null;
  kategori?: string;
  kvitto_fil?: string | null;
  kvitto_url?: string | null;
  kvitto_filtyp?: string | null;
}

export interface UtläggQueryResult {
  id: number;
  anställd_id: number;
  user_id: number;
  status: string;
  skapad: Date;
  uppdaterad: Date;
  transaktion_id: number | null;
  belopp: number;
  beskrivning: string;
  datum: string;
  kategori: string;
  kvitto_fil: string | null;
  kvitto_url: string | null;
}

export interface UtläggCreateParams {
  belopp: number;
  datum: string;
  beskrivning: string;
  kategori?: string;
  anställd_id: number;
  kvitto_fil?: string;
  kvitto_filtyp?: string;
}

export interface UtläggActionResult {
  success: boolean;
  error?: string;
  id?: number;
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
  aktivt_steg?: number;
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
  skapad_av: string; // Better Auth UUID
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
  arbetsvecka_timmar: string;
  arbetsbelastning: string;
  deltidProcent: string;
  tjänsteställeAdress: string;
  tjänsteställeOrt: string;
  skattetabell: number;
  skattekolumn: number;
  sparade_dagar?: string | number;
  använda_förskott?: string | number;
};

export interface AnställdListItem {
  id: number;
  namn: string;
  förnamn?: string;
  efternamn?: string;
  epost: string;
  mail?: string;
  email?: string;
  roll?: string;
  sparade_dagar?: number;
  använda_förskott?: number;
  skattetabell?: number;
  skattekolumn?: number;
  clearingnummer?: string;
  bankkonto?: string;
  semesterdagarPerÅr?: number;
  kvarandeDagar?: number;
  sparadeDagar?: number;
  användaFörskott?: number;
  kvarandeFörskott?: number;
  innestående?: number;
}

export interface AnställdaRadProps {
  anställd: AnställdListItem;
}

export interface PersonalContentProps {
  initialAnställda: AnställdData[];
}

export interface UtlaggBokforModalProps {
  utlägg: UtläggData;
  previewRows: UtlaggBokföringsRad[];
  onClose: () => void;
  onBokför: () => void;
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

export interface NyAnstalldHandlers {
  döljNyAnställd: () => void;
  hanteraNyAnställdSparad: () => Promise<void>;
}

export interface NyAnstalldProps {
  handlers: NyAnstalldHandlers;
}

export interface UseNyAnstalldOptions {
  onSaved?: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
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
  utlägg: UtläggData[];
  utläggLoading: boolean;
  utläggBokföringModal: UtläggBokföringModalState;
  utbetalningsdatum?: Date | null;
  // Lönekörning / Lönespec slice
  laddaLönespecar: boolean;
  löneperiod: { månad: number; år: number } | null;
  lönespecar: Record<string | number, Lönespec>;
  sparar: Record<string | number, boolean>;
  taBort: Record<string | number, boolean>;
  förhandsgranskaId: string | number | null;
  förhandsgranskaData: Record<string, unknown>;
  agiDebugData: Record<string, unknown>;
  visaAGIDebug: boolean;
  // Actions
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
  handleSanitizedChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  resetNyAnställdFormulär: () => void;
  setNyAnställdLoading: (loading: boolean) => void;
  setVisaNyAnställdFormulär: (visa: boolean) => void;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  hideToast: () => void;
  setUtlägg: (utlägg: UtläggData[]) => void;
  setUtläggLoading: (loading: boolean) => void;
  openUtläggBokföringModal: (utlägg: UtläggData, previewRows: UtlaggBokföringsRad[]) => void;
  closeUtläggBokföringModal: () => void;
  setUtläggBokföringLoading: (loading: boolean) => void;
  setLaddaLönespecar: (loading: boolean) => void;
  setLöneperiod: (period: { månad: number; år: number } | null) => void;
  setLönespecar: (map: Record<string | number, any>) => void;
  setSparar: (id: string | number, value: boolean) => void;
  setTaBort: (id: string | number, value: boolean) => void;
  skapaNyLönespec: (anställd: AnställdListItem) => Promise<void>;
  taBortLönespec: (anställd: AnställdListItem) => Promise<void>;
  openFörhandsgranskning: (anställd: AnställdListItem) => void;
  closeFörhandsgranskning: () => void;
  setAgiDebugData: (data: any) => void;
  openAGIDebug: (data?: Record<string, unknown>) => void;
  closeAGIDebug: () => void;
  clearToast: () => void;
  generateAGI: (args: Record<string, unknown>) => Promise<void>;
  setUtbetalningsdatum?: (datum: Date | null) => void;
  initStore: (data: {
    anställda?: AnställdListItem[];
    valdAnställd?: AnställdData | null;
    utlägg?: UtläggData[];
    utbetalningsdatum?: Date | null;
  }) => void;
}

export interface StoreInitProps {
  anställda?: AnställdListItem[];
  valdAnställd?: AnställdData | null;
  utlägg?: UtläggData[];
  utbetalningsdatum?: Date | null;
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
  extrarader: ExtraradData[];
  beräknadeVärden: Record<string, Record<string, unknown>>;
  anställdNamn: string;
  period: string;
  utbetalningsdatum: string;
  kommentar?: string;
  bokföringsPoster?: BokföringsPost[];
}

export interface PersonalinformationProps {
  anställd?: AnställdListItem;
  onRedigera?: () => void;
}

export interface AnställningstypProps {
  editData?: Partial<AnställdListItem>;
  handleChange?: (name: string, value: string | number) => void;
  anställd?: AnställdListItem;
  viewMode?: boolean;
  options?: { value: string; label: string }[];
}

export interface ArbetsbelastningProps {
  editData?: Partial<AnställdListItem>;
  handleChange?: (name: string, value: string | number) => void;
  anställd?: AnställdListItem;
  viewMode?: boolean;
  options?: { value: string; label: string }[];
  display?: {
    arbetsbelastningText: string;
    arbetsveckaText: string;
  };
}

export interface JobbtitelProps {
  editData?: Partial<AnställdListItem>;
  handleChange?: (name: string, value: string | number) => void;
  anställd?: AnställdListItem;
  viewMode?: boolean;
}

export interface KontraktProps {
  anställd?: AnställdListItem;
  onRedigera?: () => void;
}

export interface KontraktPeriodProps {
  editData?: Partial<AnställdListItem>;
  handleChange?: (name: string, value: string | number) => void;
  anställd?: AnställdListItem;
  viewMode?: boolean;
}

export interface LönProps {
  editData?: Partial<AnställdListItem>;
  handleChange?: (name: string, value: string | number) => void;
  anställd?: AnställdListItem;
  viewMode?: boolean;
  options?: {
    ersättningPer: { value: string; label: string }[];
  };
}

export interface SemesterProps {
  editData?: Partial<AnställdListItem>;
  handleChange?: (name: string, value: string | number) => void;
  anställd?: AnställdListItem;
  viewMode?: boolean;
}

export interface SkattProps {
  editData?: Partial<AnställdListItem>;
  handleChange?: (name: string, value: string | number) => void;
  anställd?: AnställdListItem;
  viewMode?: boolean;
  options?: {
    skattetabell: { value: string; label: string }[];
    skattekolumn: { value: string; label: string }[];
  };
}

export interface TjänsteställeProps {
  editData?: Partial<AnställdListItem>;
  handleChange?: (name: string, value: string | number) => void;
  anställd?: AnställdListItem;
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
  agiDebugData: Record<string, unknown>;
}

export interface AGIGeneratorProps {
  valdaSpecar: Lönespec[];
  anstallda: any[];
  beräknadeVärden: Record<string, Record<string, unknown>>;
  extrarader: Record<string, ExtraradData[]>;
  utbetalningsdatum: string | null;
  session: { userId: string };
  hämtaFöretagsprofil: (userId: string) => Promise<Record<string, unknown>>;
  onAGIComplete?: () => void; // Callback för när AGI är genererad
}

export interface BankgiroExportProps {
  anställda: AnställdListItem[];
  utbetalningsdatum: Date | null;
  lönespecar: Record<string, Lönespec>;
  open?: boolean;
  onClose?: () => void;
  onExportComplete?: () => void; // Callback när export är klar
  showButton?: boolean; // Om knappen ska visas
  direktNedladdning?: boolean; // Om nedladdning ska ske direkt
}

export interface BokförProps {
  anställda: AnställdListItem[];
  utbetalningsdatum?: Date | null;
  lönespecar: Record<string, Lönespec>;
}

export interface LöneKnapparProps {
  lönespec: Lönespec;
  anställd: AnställdListItem;
  företagsprofil: Företagsprofil;
  extrarader: ExtraradData[];
  beräknadeVärden: Record<string, Record<string, unknown>>;
  onForhandsgranskning: (id: string) => void;
  onTaBortLönespec: () => void;
  taBortLoading: boolean;
}

export interface LöneBatchKnapparProps {
  lönespecar: any[];
  anställda: AnställdListItem[];
  företagsprofil: any;
  extrarader: Record<string, ExtraradData[]>[];
  beräknadeVärden: Record<string, Record<string, unknown>>;
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
  // Data from parent to avoid duplicate hooks
  lonekorningar?: Lönekörning[];
  hasLonekorningar?: boolean;
  listLoading?: boolean;
  formatPeriodName?: (period: string) => string;
  getItemClassName?: (lonekorning: Lönekörning, valdLonekorningItem?: Lönekörning) => string;
}

export interface LonespecListaProps {
  valdaSpecar: LönespecData[];
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
  onLönekörningUppdaterad?: (uppdateradLönekörning: any) => void;
}

export interface LonespecManagerProps {
  valdaSpecar: Lönespec[];
  setValdaSpecar: (value: string | number[] | ((prev: any[]) => any[])) => void;
  specarPerDatum: any;
  setSpecarPerDatum: (value: string | number | ((prev: any) => any)) => void;
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
  anstallda: AnställdData[];
  onSpecCreated: () => void;
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
  valdaSpecar: LönespecData[];
  skatteData: any;
  utbetalningsdatum: string | null;
  skatteDatum: Date | null;
  setSkatteDatum: (date: Date | null) => void;
  hanteraBokförSkatter: () => void;
  skatteBokförPågår: boolean;
  onHämtaBankgiro?: () => void;
}

export interface SkatteManagerProps {
  valdaSpecar: Lönespec[];
  beräknadeVärden: Record<string, Record<string, unknown>>;
  skatteDatum: Date | null;
  setSkatteBokförPågår: (loading: boolean) => void;
  setSkatteModalOpen: (open: boolean) => void;
  bokförLöneskatter: (data: any) => Promise<Record<string, unknown>>;
  onSkatteComplete?: () => void;
}

export interface PersonalAction {
  type: string;
  payload?: any;
}

// ===========================================
// HOOK TYPES - Migrerade från individuella hooks
// ===========================================

// useNySpecModal types - redan definierade ovan ✅

// useUtlagg types

// useUtlagg types
export type UtläggBokföringModal = {
  isOpen: boolean;
  utlägg: any | null;
  previewRows: any[];
  loading: boolean;
};

// useSemester types
export type SemesterBokförModal = {
  isOpen: boolean;
  loading: boolean;
};

export type SemesterData = {
  betalda_dagar: number;
  sparade_dagar: number;
  skuld: number;
  komp_dagar: number;
};

// useAnstallda types
export type PersonalEditData = {
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
};

// useLonespec types
export interface Lönespec {
  id: string;
  [key: string]: any;
}

// useLonekorning types
export type ToastType = "success" | "error" | "info";

export type GenerateAGIArgs = {
  valdaSpecar: Lönespec[];
  anstallda: any[];
  beräknadeVärden: Record<string, Record<string, unknown>>;
  extrarader: Record<string, ExtraradData[]>;
  utbetalningsdatum: string | null;
  session: { userId: string };
  hämtaFöretagsprofil: (userId: string) => Promise<Record<string, unknown>>;
  onAGIComplete?: () => void;
};

export type UseLonekorningInit = {
  anställda?: any[];
  utbetalningsdatum?: Date | null;
  onLonespecarChange?: (specar: Record<string, any>) => void;
};

export interface LonekorningState {
  laddaLönespecar: boolean;
  löneperiod: { månad: number; år: number } | null;
  sparar: Record<string | number, boolean>;
  taBort: Record<string | number, boolean>;
  förhandsgranskaId: string | null;
  förhandsgranskaData: Record<string, unknown>;
  toast: { type: ToastType; message: string } | null;
  utbetalningsdatum: Date | null;
  anställda: AnställdListItem[];
  anställdaLoading: boolean;
  harLönespec: (anställdId: string | number) => boolean;
  getLönespec: (anställdId: string | number) => any;
}

export interface LonekorningHandlers {
  setUtbetalningsdatum: (d: Date | null) => void;
  skapaNyLönespec: (anställd: AnställdListItem) => Promise<void>;
  taBortLönespec: (anställd: AnställdListItem) => Promise<void>;
  openFörhandsgranskning: (anställd: AnställdListItem) => void;
  closeFörhandsgranskning: () => void;
  clearToast: () => void;
  generateAGI: (args: GenerateAGIArgs) => Promise<void>;
}

export interface UseLonekorningReturn {
  state: LonekorningState;
  handlers: LonekorningHandlers;
  // Deprecated: direkt-access (tillfällig bakåtkompabilitet)
  laddaLönespecar: boolean;
  löneperiod: { månad: number; år: number } | null;
  sparar: Record<string | number, boolean>;
  taBort: Record<string | number, boolean>;
  förhandsgranskaId: string | null;
  förhandsgranskaData: Record<string, unknown>;
  toast: { type: ToastType; message: string } | null;
  utbetalningsdatum: Date | null;
  setUtbetalningsdatum: (d: Date | null) => void;
  anställda: AnställdListItem[];
  anställdaLoading: boolean;
  harLönespec: (anställdId: string | number) => boolean;
  getLönespec: (anställdId: string | number) => any;
  skapaNyLönespec: (anställd: AnställdListItem) => Promise<void>;
  taBortLönespec: (anställd: AnställdListItem) => Promise<void>;
  openFörhandsgranskning: (anställd: AnställdListItem) => void;
  closeFörhandsgranskning: () => void;
  clearToast: () => void;
  generateAGI: (args: GenerateAGIArgs) => Promise<void>;
}

// Semester types (moved from semesterTypes.ts)
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
  skapad_av: string; // Better Auth UUID (duplicate interface)
}

export interface InformationState {
  valdAnställd: AnställdData | null;
  personalIsEditing: boolean;
  personalHasChanges: boolean;
  personalErrorMessage: string | null;
  personalEditData: PersonalEditData;
}

export interface InformationHandlers {
  personalOnEdit: () => void;
  personalOnSave: () => void;
  personalOnCancel: () => void;
  personalOnChange: (name: string, value: string) => void;
}

export interface AnställdaListaState {
  anställda: AnställdListItem[];
}

export interface AnställdaListaHandlers {
  hanteraAnställdKlick: (id: number) => void;
  taBortAnställdFrånLista: (id: number) => void;
  [key: string]: unknown; // Additional flexible handlers
}

export interface AnställdaListaProps {
  state: AnställdaListaState;
  handlers: AnställdaListaHandlers;
}

export interface AnställdaRadPropsWithHandlers extends AnställdaRadProps {
  handlers: AnställdaListaHandlers;
}

export interface InformationProps {
  state: InformationState;
  handlers: InformationHandlers;
}

// Lonespecar interfaces
export interface LonespecContextType {
  lönespecar: Lönespec[];
  setLonespecar: (lönespecar: Lönespec[]) => void;
  extrarader: Record<string, ExtraradData[]>;
  setExtrarader: (id: string, extrarader: ExtraradData[]) => void;
  beräknadeVärden: Record<string, Record<string, unknown>>;
  setBeräknadeVärden: (id: string, värden: Record<string, unknown>) => void;
}

export interface ExtraRad {
  id: string;
  typ: string;
  antal: number;
  belopp: number;
  tillagd: boolean;
}

export interface SimpleBokföringsPost {
  konto: string;
  kontoNamn: string;
  debet: number;
  kredit: number;
}

export interface LonespecListProps {
  anställd: AnställdListItem;
  utlägg: any[];
  ingenAnimering?: boolean;
  onTaBortLönespec?: () => void;
  taBortLoading?: boolean;
  onLönespecUppdaterad?: () => void;
  visaExtraRader?: boolean;
}

export interface LönespecViewProps {
  lönespec: any;
  anställd?: AnställdListItem;
  utlägg: any[];
  ingenAnimering?: boolean;
  onTaBortLönespec?: () => void;
  taBortLoading?: boolean;
  företagsprofil?: any;
  visaExtraRader?: boolean;
}

export interface SammanfattningProps {
  utbetalningsDatum: Date;
  nettolön: number;
  lönespec: any;
  anställd?: AnställdListItem;
  bruttolön: number;
  skatt: number;
  socialaAvgifter?: number;
  lönekostnad?: number;
  onVisaBeräkningar?: () => void;
}

export interface StatusBadgeProps {
  status: string;
  type: "lönespec" | "utlägg";
}

// Extrarader interfaces
export interface ExtraraderGridProps {
  sökterm: string;
  state: Record<string, boolean>;
  open: Record<string, boolean>;
  toggleDropdown: (key: string) => void;
  toggleCheckbox: (id: string, label: string) => void;
  onRemoveRow?: (id: string) => void;
}

export interface ExtraraderField {
  label: string;
  name: string;
  type: "text" | "number" | "select";
  value: string | null | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  required?: boolean;
  placeholder?: string;
  step?: string;
  min?: string;
  hidden?: boolean;
  options?: string[];
}

export interface ExtraraderModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  fields: ExtraraderField[];
  onSubmit: (e: React.FormEvent) => void;
  anstalldId?: number;
}

export interface ExtraraderSokningProps {
  sökterm: string;
  setSökterm: (term: string) => void;
}

export interface ExtraradRadOchDropdownProps {
  label: string;
  checked?: boolean;
  toggle: () => void;
  onRemove?: () => void;
  isDropdown?: boolean;
  open?: boolean;
  onToggleDropdown?: () => void;
  id?: string;
}

// Forhandsgranskning interfaces
export interface ForhandsgranskningProps {
  lönespec: Lönespec;
  anställd: AnställdListItem;
  företagsprofil: Företagsprofil;
  extrarader: ExtraradData[];
  beräknadeVärden?: Record<string, Record<string, unknown>>;
  onStäng: () => void;
}

export interface FormelVisningProps {
  beräknadeVärden: Record<string, Record<string, unknown>>;
  extrarader: ExtraradData[];
  lönespec: Lönespec;
}

export interface ToppInfoProps {
  månadsNamn: string;
  lönespec: Lönespec;
  anställd?: AnställdListItem;
  getLönespecStatusBadge: (status: string) => React.ReactElement;
}

// Förhandsgranskning component interfaces
export interface ArbetstidInfoProps {
  lönespec: Lönespec;
  formatNoDecimals: (value: number) => string;
}

export interface ÅrssammanställningProps {
  bruttolön: number;
  skatt: number;
  formatNoDecimals: (value: number) => string;
}

export interface FotinfoProps {
  företag: any;
}

export interface HuvudinfoProps {
  anställd: AnställdData;
  månadsNamn: string;
  periodStart: Date;
  periodSlut: Date;
}

export interface LönetabellProps {
  lönespec: Lönespec;
  bruttolön: number;
  extraraderMapped: Array<{
    benämning: string;
    antal?: string | number;
    kostnad: number;
    summa: number;
  }>;
  formatNoDecimals: (value: number) => string;
}

export interface SemesterInfoProps {
  lönespec: Lönespec;
  anställd: AnställdData;
  formatNoDecimals: (value: number) => string;
}

export interface SkatteInfoProps {
  anställd: AnställdData;
}

// Lonekomponenter interfaces
export interface LöneRadItemProps {
  benämning: string;
  belopp: number;
  typ: "total" | "extrarad" | "netto" | "varav";
  onTaBort?: () => void;
  kommentar?: string;
}

export interface LöneTabellProps {
  beräknadeVärden: {
    lönekostnad: number;
    socialaAvgifter: number;
    bruttolön: number;
    skatt: number;
    nettolön: number;
    dagavdrag?: {
      föräldraledighet?: number;
      vårdAvSjuktBarn?: number;
      sjukfrånvaro?: number;
      totalt?: number;
    };
  };
  grundlön: number | undefined;
  extrarader: ExtraradData[];
  onTaBortExtrarad: (id: number) => void;
}

export type LonekomponenterProps = {
  lönespec: any;
  grundlön?: number;
  övertid?: number;
  visaExtraRader?: boolean;
  anstalldId?: number;
};

// Semester interfaces
export interface BokforModalProps {
  open: boolean;
  onClose: () => void;
  rows: { konto: string; namn: string; debet: number; kredit: number }[];
  onConfirm?: (kommentar: string) => void;
}

export type SemesterBoxField = "betalda_dagar" | "sparade_dagar" | "skuld" | "komp_dagar";

export type SemesterBoxSummary = {
  betalda_dagar: number;
  sparade_dagar: number;
  skuld: number;
  komp_dagar: number;
};

export interface ModernSemesterProps {
  anställd: {
    id: number;
    förnamn: string;
    efternamn: string;
    kompensation: number;
    anställningsdatum: string;
    tjänstegrad?: number;
  };
  userId: number;
}

export interface SemesterdataProps {
  editData?: Partial<AnställdListItem>;
  handleChange?: (name: string, value: string | number) => void;
  isEditing?: boolean;
}

export interface TransaktionerProps {
  anställd?: AnställdListItem;
}

export interface Transaktion {
  id: string;
  datum: string;
  typ: string;
  antal: number;
  från_datum?: string;
  till_datum?: string;
  beskrivning?: string;
  lönespec_månad?: number;
  lönespec_år?: number;
  bokfört: boolean;
}

// Utlagg interfaces
export interface Utlägg {
  id: number;
  belopp: number;
  beskrivning: string;
  datum: string;
  kategori?: string;
  status: string;
  anställd_namn?: string;
  kvitto_fil?: string;
  kvitto_url?: string;
}

export interface UtlaggFlikProps {
  state: {
    valdAnställd?: AnställdData | AnställdListItem | null;
  };
  handlers?: {
    laddaUtläggFörAnställd?: () => void;
    [key: string]: unknown;
  };
}

export interface UtläggProps {
  lönespecUtlägg: any[];
  getStatusBadge: (status: string) => React.ReactElement;
  lönespecId?: number;
  onUtläggAdded?: (tillagdaUtlägg: any[], extraradResults: any[]) => Promise<void>;
  extrarader?: any[];
  anställdId?: number;
}

// Lonekorning Wizard interfaces
export interface WizardBokföringsPost {
  konto: string;
  kontoNamn: string;
  debet: number;
  kredit: number;
  beskrivning: string;
}

export interface BokforLonerProps {
  lönespec: any;
  extrarader: ExtraradData[];
  beräknadeVärden: BeräknadeVärden;
  anställdNamn: string;
  isOpen: boolean;
  onClose: () => void;
  onBokfört?: () => void;
}

export interface SingleLönespec {
  lönespec: any;
  anställd: AnställdListItem;
  företagsprofil: any;
  extrarader: ExtraradData[];
  beräknadeVärden?: any;
}

export interface MailaLonespecProps {
  // For single mode
  lönespec?: any;
  anställd?: AnställdListItem;
  företagsprofil?: any;
  extrarader?: any[];
  beräknadeVärden?: any;
  // For batch mode
  batch?: SingleLönespec[];
  batchMode?: boolean;
  open?: boolean;
  onClose?: () => void;
  onMailComplete?: () => void;
}

// Utils interfaces
export interface AGIData {
  agRegistreradId: string;
  redovisningsperiod: string;
  organisationsnummer: string;
  tekniskKontakt: {
    namn: string;
    telefon: string;
    epost: string;
  };
  företag: {
    adress: string;
    postnummer: string;
    stad: string;
    företagsnamn: string;
  };
  individuppgifter: Array<{
    specifikationsnummer: number;
    betalningsmottagareId?: string;
    fodelsetid?: string;
    annatId?: string;
    fornamn?: string;
    efternamn?: string;
    gatuadress?: string;
    postnummer?: string;
    postort?: string;
    bruttolön?: number;
    skatt?: number;
    kontantErsattningUlagAG?: number;
    kontantErsattningEjUlagSA?: number;
    skatteplBilformanUlagAG?: number;
    skatteplOvrigaFormanerUlagAG?: number;
    avrakningAvgiftsfriErs?: number;
  }>;
  franvarouppgifter: Array<{
    franvaroDatum: string;
    betalningsmottagareId: string;
    specifikationsnummer: number;
    franvaroTyp: string;
    franvaroProcentTFP?: number;
    franvaroTimmarTFP?: number;
    franvaroProcentFP?: number;
    franvaroTimmarFP?: number;
    franvaroBorttag?: boolean;
  }>;
}

export interface BokföringsRegel {
  debet?: string;
  kredit?: string;
  namn: string;
  beskrivning?: string;
}

export interface RadKonfiguration {
  label: string;
  enhet: string;
  beräknaVärde?: (
    grundlön: number,
    modalFields?: ModalFields,
    arbetstimmarPerVecka?: number
  ) => number;
  beräknaTotalt?: (
    grundlön: number,
    modalFields?: ModalFields,
    arbetstimmarPerVecka?: number
  ) => number;
  negativtBelopp?: boolean;
  skattepliktig?: boolean;
  läggTillINettolön?: boolean;
  läggTillIBruttolön?: boolean;
  fält: {
    antalLabel: string;
    antalPlaceholder: string;
    beloppPlaceholder?: string;
    step?: string;
    beräknaTotalsummaAutomatiskt?: boolean;
    enhetDropdown?: string[];
    skipKommentar?: boolean;
    [key: string]: any;
  };
}

export type RadKonfigurationType = RadKonfiguration;

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
  skapad_av: string; // Better Auth UUID (third duplicate)
}

export interface SemesterSummary {
  betalda_dagar: number;
  sparade_dagar: number;
  skuld: number;
  komp_dagar: number;
}

export interface BokföringsRad {
  konto: string;
  kontoNamn: string;
  debet: number;
  kredit: number;
  beskrivning: string;
  anställdNamn?: string;
}

export interface BokföringsSummering {
  rader: BokföringsRad[];
  totalDebet: number;
  totalKredit: number;
  balanserar: boolean;
}

export interface UtilsSemesterBokföring {
  anställdId: number;
  anställdNamn: string;
  typ: "uttag" | "avsättning" | "avstämning" | "uppsägning";
  datum: string;
  dagar: number;
  månadslön: number;
  kommentar?: string;
}

export interface LöneBeräkning {
  grundlön: number;
  tillägg: number;
  avdrag: number;
  bruttolön: number;
  socialaAvgifter: number;
  skatt: number;
  nettolön: number;
  totalLönekostnad: number;
}

export interface LöneKontrakt {
  månadslön: number;
  arbetstimmarPerVecka: number;
  skattetabell: number;
  skattekolumn: number;
  kommunalSkatt: number;
  socialaAvgifterSats: number;
}

export interface DagAvdrag {
  föräldraledighet: number;
  vårdAvSjuktBarn: number;
  sjukfrånvaro: number;
}

export type BilTyp = "bensinDiesel" | "el";

export interface UtilsExtrarad {
  kolumn1: string;
  kolumn2: string;
  kolumn3: string;
  kolumn4?: string;
}

export interface SemesterIntjäning {
  intjänandeår: string;
  intjänadeDagar: number;
  intjänadPengaTillägg: number;
  återstående: number;
  uttagna: number;
}

export interface SemesterBeräkning {
  månadslön: number;
  anställningsdatum: Date;
  heltid: boolean;
  tjänstegrad: number;
}

// Lonekorning component types
export interface LonekorningProps {
  anställda?: AnställdData[];
  anställdaLoading?: boolean;
  onAnställdaRefresh?: () => void;
}

export interface BatchDataItem {
  lönespec: any;
  anställd: AnställdData | any; // Using any for now due to mixed types in codebase
  företagsprofil: any;
  extrarader: ExtraradData[];
  beräknadeVärden: Record<string, Record<string, unknown>>;
}

// useLonekorning hook types
export interface LonekorningHookProps {
  anställda?: any[];
  anställdaLoading?: boolean;
  onAnställdaRefresh?: () => void;
  extrarader?: any;
  beräknadeVärden?: any;
  // Lista mode props
  enableListMode?: boolean;
  refreshTrigger?: any;
  // Spec lista mode props
  enableSpecListMode?: boolean;
  specListValdaSpecar?: any[];
  specListLönekörning?: any;
  // Spec lista callbacks (these override the internal functions)
  onSpecListTaBortSpec?: (id: number) => Promise<void>;
  onSpecListHämtaBankgiro?: () => void;
  onSpecListMailaSpecar?: () => void;
  onSpecListBokför?: () => void;
  onSpecListGenereraAGI?: () => void;
  onSpecListBokförSkatter?: () => void;
  // New lönekörning modal props
  enableNewLonekorningModal?: boolean;
  onLonekorningCreated?: (lonekorning: any) => void;
}

// Actions types
export interface FormActionState {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface Företagsprofil {
  företagsnamn: string;
  adress: string;
  postnummer: string;
  stad: string;
  organisationsnummer: string;
  momsregistreringsnummer: string;
  telefonnummer: string;
  epost: string;
  webbplats: string;
}

export interface LönespecData {
  id: number;
  anställd_id: number;
  grundlön: number;
  skatt: number;
  [key: string]: any; // För andra dynamiska fält
}

export interface BeräknadeVärden {
  kontantlön?: number;
  skatt?: number;
  nettolön?: number;
  [key: string]: any; // För andra beräknade värden
}
