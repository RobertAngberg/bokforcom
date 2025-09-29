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

export interface ModalFields {
  kolumn1?: string | null;
  kolumn2?: string | null;
  kolumn3?: string | null;
  kolumn4?: string | null;
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
  lönespecar: Record<string | number, any>;
  sparar: Record<string | number, boolean>;
  taBort: Record<string | number, boolean>;
  förhandsgranskaId: string | number | null;
  förhandsgranskaData: any;
  agiDebugData: any;
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
  handleSanitizedChange: (e: any) => void;
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
  skapaNyLönespec: (anställd: any) => Promise<void>;
  taBortLönespec: (anställd: any) => Promise<void>;
  openFörhandsgranskning: (anställd: any) => void;
  closeFörhandsgranskning: () => void;
  setAgiDebugData: (data: any) => void;
  openAGIDebug: (data?: any) => void;
  closeAGIDebug: () => void;
  clearToast: () => void;
  generateAGI: (args: any) => Promise<void>;
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
  // Data from parent to avoid duplicate hooks
  lonekorningar?: Lönekörning[];
  hasLonekorningar?: boolean;
  listLoading?: boolean;
  formatPeriodName?: (period: string) => string;
  getItemClassName?: (lonekorning: Lönekörning, valdLonekorningItem?: Lönekörning) => string;
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
  onLönekörningUppdaterad?: (uppdateradLönekörning: any) => void;
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
  valdaSpecar: any[];
  anstallda: any[];
  beräknadeVärden: any;
  extrarader: any;
  utbetalningsdatum: string | null;
  session: any;
  hämtaFöretagsprofil: (userId: string) => Promise<any>;
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
  förhandsgranskaData: any;
  toast: { type: ToastType; message: string } | null;
  utbetalningsdatum: Date | null;
  anställda: any[];
  anställdaLoading: boolean;
  harLönespec: (anställdId: string | number) => boolean;
  getLönespec: (anställdId: string | number) => any;
}

export interface LonekorningHandlers {
  setUtbetalningsdatum: (d: Date | null) => void;
  skapaNyLönespec: (anställd: any) => Promise<void>;
  taBortLönespec: (anställd: any) => Promise<void>;
  openFörhandsgranskning: (anställd: any) => void;
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
  förhandsgranskaData: any;
  toast: { type: ToastType; message: string } | null;
  utbetalningsdatum: Date | null;
  setUtbetalningsdatum: (d: Date | null) => void;
  anställda: any[];
  anställdaLoading: boolean;
  harLönespec: (anställdId: string | number) => boolean;
  getLönespec: (anställdId: string | number) => any;
  skapaNyLönespec: (anställd: any) => Promise<void>;
  taBortLönespec: (anställd: any) => Promise<void>;
  openFörhandsgranskning: (anställd: any) => void;
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
  [key: string]: unknown; // Flexible handlers for employee actions
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
  extrarader: Record<string, any[]>;
  setExtrarader: (id: string, extrarader: any[]) => void;
  beräknadeVärden: Record<string, any>;
  setBeräknadeVärden: (id: string, värden: any) => void;
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
  anställd: any;
  utlägg: any[];
  ingenAnimering?: boolean;
  onTaBortLönespec?: () => void;
  taBortLoading?: boolean;
  onLönespecUppdaterad?: () => void;
  visaExtraRader?: boolean;
}

export interface LönespecViewProps {
  lönespec: any;
  anställd: any;
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
  anställd: any;
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
  value: string;
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
  lönespec: any;
  anställd: any;
  företagsprofil: any;
  extrarader: any[];
  beräknadeVärden?: any;
  onStäng: () => void;
}

export interface FormelVisningProps {
  beräknadeVärden: any;
  extrarader: any[];
  lönespec: any;
}

export interface ToppInfoProps {
  månadsNamn: string;
  lönespec: any;
  anställd: any;
  getLönespecStatusBadge: (status: string) => React.ReactElement;
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
  extrarader: any[];
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
  editData?: any;
  handleChange?: (name: string, value: any) => void;
  isEditing?: boolean;
}

export interface TransaktionerProps {
  anställd?: any;
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
  state: any;
  handlers: any;
  utlaggFlikData: () => any;
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
  extrarader: any[];
  beräknadeVärden: any;
  anställdNamn: string;
  isOpen: boolean;
  onClose: () => void;
  onBokfört?: () => void;
}

export interface SingleLönespec {
  lönespec: any;
  anställd: any;
  företagsprofil: any;
  extrarader: any[];
  beräknadeVärden?: any;
}

export interface MailaLonespecProps {
  // For single mode
  lönespec?: any;
  anställd?: any;
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
  skattetabell: string;
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
  beräknadeVärden: any;
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
