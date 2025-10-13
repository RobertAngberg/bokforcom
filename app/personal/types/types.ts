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

export interface MappedExtrarad {
  benämning: string;
  antal: string;
  kostnad: number;
  summa: number;
  kommentar: string;
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

export type AnställdData = {
  id: number; // Gör required för kompatibilitet med AnställdListItem
  namn: string; // Gör required för kompatibilitet med AnställdListItem
  förnamn: string;
  efternamn: string;
  personnummer: string;
  jobbtitel: string;
  mail: string;
  epost: string; // Gör required för kompatibilitet med AnställdListItem
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
  sparade_dagar?: number; // Ändra till number för kompatibilitet med AnställdListItem
  använda_förskott?: number; // Ändra till number för kompatibilitet med AnställdListItem
};

export type AnställdInput = Omit<AnställdData, "id" | "namn" | "epost"> &
  Partial<Pick<AnställdData, "id" | "namn" | "epost">>;

export interface AnställdListItem {
  id: number;
  namn: string;
  förnamn?: string;
  efternamn?: string;
  epost: string;
  mail?: string;
  email?: string;
  roll?: string;

  // Kontrakt-relaterade fält
  jobbtitel?: string;
  anställningstyp?: string;
  löneperiod?: string;
  ersättningPer?: string;
  kompensation?: string;
  arbetsvecka_timmar?: string;
  arbetsbelastning?: string;
  deltidProcent?: string;
  tjänsteställeAdress?: string;
  tjänsteställeOrt?: string;
  startdatum?: string;
  slutdatum?: string;
  anställningsdatum?: string;
  tjänstegrad?: number;

  // Skatt och bank
  skattetabell?: number;
  skattekolumn?: number;
  clearingnummer?: string;
  bankkonto?: string;
  personnummer?: string;
  adress?: string;
  postnummer?: string;
  ort?: string;

  // Semester
  sparade_dagar?: number;
  använda_förskott?: number;
  semesterdagarPerÅr?: number;
  kvarandeDagar?: number;
  sparadeDagar?: number;
  användaFörskott?: number;
  kvarandeFörskott?: number;
  innestående?: number;
  växaStöd?: boolean;
}

export interface PersonalContentProps {
  initialAnställda: AnställdData[];
}

export interface UtlaggBokföringsRad {
  kontonummer: string;
  beskrivning: string;
  debet: number;
  kredit: number;
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
  beräknadeVärden: BeräknadeVärden;
  anställdNamn: string;
  period: string;
  utbetalningsdatum: string;
  kommentar?: string;
  bokföringsPoster?: BokföringsPost[];
}

export interface AnställningstypProps {
  editData?: Partial<EditData>;
  handleChange?: (name: string, value: string | number | Date) => void;
  anställd?: AnställdListItem;
  viewMode?: boolean;
  options?: { value: string; label: string }[];
}

export interface ArbetsbelastningProps {
  editData?: Partial<EditData>;
  handleChange?: (name: string, value: string | number | Date) => void;
  anställd?: AnställdListItem;
  viewMode?: boolean;
  options?: { value: string; label: string }[];
  display?: {
    arbetsbelastningText: string;
    arbetsveckaText: string;
  };
}

export interface JobbtitelProps {
  editData?: Partial<EditData>;
  handleChange?: (name: string, value: string | number | Date) => void;
  anställd?: AnställdListItem;
  viewMode?: boolean;
}

export interface KontraktProps {
  anställd?: AnställdListItem;
  onRedigera?: () => void;
}

export interface KontraktPeriodProps {
  editData?: Partial<EditData>;
  handleChange?: (name: string, value: string | number | Date) => void;
  anställd?: AnställdListItem;
  viewMode?: boolean;
}

export interface LönProps {
  editData?: Partial<EditData>;
  handleChange?: (name: string, value: string | number | Date) => void;
  anställd?: AnställdListItem;
  viewMode?: boolean;
  options?: {
    ersättningPer: { value: string; label: string }[];
  };
}

export interface SemesterProps {
  editData?: Partial<EditData>;
  handleChange?: (name: string, value: string | number | Date) => void;
  anställd?: AnställdListItem;
  viewMode?: boolean;
}

export interface SkattProps {
  editData?: Partial<EditData>;
  handleChange?: (name: string, value: string | number | Date) => void;
  anställd?: AnställdListItem;
  viewMode?: boolean;
  options?: {
    skattetabell: { value: string; label: string }[];
    skattekolumn: { value: string; label: string }[];
  };
}

export interface TjänsteställeProps {
  editData?: Partial<EditData>;
  handleChange?: (name: string, value: string | number | Date) => void;
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
  arbetsvecka_timmar: string;
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
export interface AGIGeneratorProps {
  valdaSpecar: Lönespec[];
  anstallda: AnställdListItem[];
  beräknadeVärden: Record<string, BeräknadeVärden>;
  extrarader: Record<string, ExtraradData[]>;
  utbetalningsdatum: string | null;
  session: { userId: string };
  hamtaForetagsprofil: (userId: string) => Promise<Record<string, unknown>>;
  onAGIComplete?: () => void; // Callback för när AGI är genererad
}

export interface BankgiroExportProps {
  anställda: AnställdListItem[];
  utbetalningsdatum: Date | null;
  lönespecar: Record<string | number, Lönespec>;
  open?: boolean;
  onClose?: () => void;
  onExportComplete?: () => void; // Callback när export är klar
  showButton?: boolean; // Om knappen ska visas
  direktNedladdning?: boolean; // Om nedladdning ska ske direkt
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
  onTaBortLonekorning?: (lonekorning: Lönekörning) => void;
  taBortLoading?: boolean;
}

export interface LonespecListaProps {
  valdaSpecar: LönespecData[];
  anstallda: AnställdListItem[];
  utlaggMap: Record<number, UtläggData[]>;
  lönekörning?: Lönekörning;
  onTaBortSpec: (specId: number) => Promise<void>;
  onHämtaBankgiro: () => void;
  onMailaSpecar: () => void;
  onBokför: () => void;
  onGenereraAGI: () => void;
  onBokförSkatter: () => void;
  onRefreshData?: () => Promise<void>;
  period?: string;
  onLönekörningUppdaterad?: (uppdateradLönekörning: Lönekörning) => void;
}

export interface NyLonekorningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLonekorningCreated: (lonekorning: Lönekörning) => void;
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
  specarPerDatum: Record<string, Lönespec[]>;
}

export interface SkatteBokforingModalProps {
  skatteModalOpen: boolean;
  setSkatteModalOpen: (open: boolean) => void;
  valdaSpecar: LönespecData[];
  skatteData: {
    socialaAvgifter: number;
    personalskatt: number;
    totaltSkatter: number;
  };
  utbetalningsdatum: string | null;
  skatteDatum: Date | null;
  setSkatteDatum: (date: Date | null) => void;
  hanteraBokförSkatter: () => void;
  skatteBokförPågår: boolean;
  onHämtaBankgiro?: () => void;
}

// ===========================================
// HOOK TYPES - Migrerade från individuella hooks
// ===========================================

// useNySpecModal types - redan definierade ovan ✅

// useUtlagg types

// useUtlagg types
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
  id: number;
  anställd_id?: number;
  grundlön?: number;
  bruttolön?: number;
  skatt?: number;
  nettolön?: number;
  sociala_avgifter?: number;
  skatter_bokförda?: boolean;
  agi_genererad?: boolean;

  // Datum och period
  månad?: number;
  år?: number;
  utbetalningsdatum?: string | Date | null;
  period_start?: string | Date | null;
  period_slut?: string | Date | null;
  skapad?: string | Date | null;

  // Övriga lönekomponenter
  övertid?: number;
  arbetstimmarPerVecka?: number;
  semester_uttag?: number;
  arbetade_timmar?: number | null;
  övertid_timmar?: number | null;
  sjukfrånvaro_dagar?: number | null;

  // Status flags
  bankgiro_exporterad?: boolean;
  mailad?: boolean;
  bokförd?: boolean;
}

export interface LonespecListProps {
  anställd: AnställdListItem;
  lönespecar: Lönespec[];
  utlägg: UtläggData[];
  ingenAnimering?: boolean;
  onTaBortLönespec?: () => void;
  taBortLoading?: boolean;
  onLönespecUppdaterad?: () => void;
  taBortLaddning?: Record<number, boolean>;
  visaExtraRader?: boolean;
}

export interface LönespecViewProps {
  lönespec: Lönespec;
  anställd?: AnställdListItem;
  utlägg: UtläggData[];
  ingenAnimering?: boolean;
  onTaBortLönespec?: () => void;
  taBortLoading?: boolean;
  företagsprofil?: Företagsprofil;
  visaExtraRader?: boolean;
}

export interface SammanfattningProps {
  utbetalningsDatum: Date;
  nettolön: number;
  bruttolön: number;
  skatt: number;
  socialaAvgifter: number;
  extraraderMapped: MappedExtrarad[];
  formatNoDecimals: (num: number) => string;
}

// SpecVy version of Sammanfattning has different props
export interface SpecVySammanfattningProps {
  utbetalningsDatum: Date;
  nettolön: number;
  lönespec: Lönespec;
  anställd?: AnställdListItem;
  bruttolön: number;
  skatt: number;
  socialaAvgifter?: number;
  lönekostnad?: number;
  onVisaBeräkningar?: () => void;
  semesterSummary?: SemesterBoxSummary | null;
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

export interface ExtraraderModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  fields: FormField[];
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
  företagsprofil: Företagsprofil | null;
  extrarader: ExtraradData[];
  beräknadeVärden?: BeräknadeVärden;
  semesterSummary?: SemesterBoxSummary | null;
  onStäng: () => void;
}

export interface FormelVisningProps {
  beräknadeVärden: BeräknadeVärden;
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
  företag: Företagsprofil;
}

export interface HuvudinfoProps {
  anställd: AnställdListItem;
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
    kommentar: string;
  }>;
  formatNoDecimals: (value: number) => string;
}

export interface SemesterInfoProps {
  lönespec: Lönespec;
  anställd: AnställdListItem;
  semesterSummary?: SemesterBoxSummary | null;
}

export interface SkatteInfoProps {
  anställd: AnställdListItem;
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
  lönespec: Lönespec;
  grundlön?: number;
  övertid?: number;
  visaExtraRader?: boolean;
  anstalldId?: number;
  skattetabell?: number;
  skattekolumn?: number;
  extrarader?: ExtraradData[];
  onExtraraderChange: (rader: ExtraradData[]) => void;
  setBeräknadeVärden: (lönespecKey: string, värden: BeräknadeVärden) => void;
};

// Semester interfaces
export interface BokforModalProps {
  open: boolean;
  onClose: () => void;
  rows: BokföringsRad[];
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
  status?: string;
  anställd_namn?: string;
  kvitto_fil?: string | null;
  kvitto_url?: string | null;
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
  lönespecUtlägg: UtläggData[];
  getStatusBadge: (status: string) => React.ReactElement;
  lönespecId?: number;
  onUtläggAdded?: (
    tillagdaUtlägg: UtläggData[],
    extraradResults: ExtraradResult[]
  ) => Promise<void>;
  extrarader?: ExtraradData[];
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
  lönespec: Lönespec;
  extrarader: ExtraradData[];
  beräknadeVärden: BeräknadeVärden;
  anställdNamn: string;
  isOpen: boolean;
  onClose: () => void;
  onBokfört?: () => void;
}

export interface SingleLönespec {
  lönespec: Lönespec;
  anställd: AnställdListItem;
  företagsprofil: Företagsprofil | null;
  extrarader: ExtraradData[];
  beräknadeVärden: BeräknadeVärden;
}

export interface MailaLonespecProps {
  // Single mode only
  lönespec?: Lönespec;
  anställd?: AnställdListItem;
  företagsprofil?: Företagsprofil;
  extrarader?: ExtraradData[];
  beräknadeVärden?: BeräknadeVärden;
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
    modalFields?: ModalFields | number,
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
    [key: string]: string | number | boolean | string[] | undefined;
  };
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

// Lonekorning component types
export interface LonekorningProps {
  anställda?: AnställdData[];
  anställdaLoading?: boolean;
  onAnställdaRefresh?: () => void;
}

export interface BatchDataItem {
  lönespec: Lönespec;
  anställd: AnställdListItem;
  företagsprofil: Företagsprofil | null;
  extrarader: ExtraradData[];
  beräknadeVärden: BeräknadeVärden;
}

// useLonekorning hook types
export interface LonekorningHookProps {
  anställda?: AnställdListItem[];
  anställdaLoading?: boolean;
  onAnställdaRefresh?: () => void;
  // Lista mode props
  enableListMode?: boolean;
  refreshTrigger?: number;
  // Spec lista mode props
  enableSpecListMode?: boolean;
  specListValdaSpecar?: Lönespec[];
  specListLönekörning?: Lönekörning;
  // Spec lista callbacks (these override the internal functions)
  onSpecListTaBortSpec?: (id: number) => Promise<void>;
  onSpecListHämtaBankgiro?: () => void;
  onSpecListMailaSpecar?: () => void;
  onSpecListBokför?: () => void;
  onSpecListGenereraAGI?: () => void;
  onSpecListBokförSkatter?: () => void;
  // New lönekörning modal props
  enableNewLonekorningModal?: boolean;
  onLonekorningCreated?: (lonekorning: Lönekörning) => void;
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
  // Index signature removed for type safety - define all fields explicitly
}

// FöretagsData - Flexiblare version av Företagsprofil för AGI och andra integrationer
export interface FöretagsData {
  organisationsnummer?: string;
  kontaktperson?: string;
  telefonnummer?: string;
  epost?: string;
  företagsnamn?: string;
  adress?: string;
  postnummer?: string;
  stad?: string;
  [key: string]: unknown;
}

export interface LönespecData {
  id: number;
  anställd_id: number;
  grundlön: number;
  skatt: number;
  bruttolön?: number;
  nettolön?: number;
  sociala_avgifter?: number;
  skatter_bokförda?: boolean;
  agi_genererad?: boolean;
  utbetalningsdatum?: string | Date | null;
  extrarader?: ExtraradData[]; // ✅ Extrarader laddas från databasen
}

export interface BeräknadeVärden {
  kontantlön?: number;
  bruttolön?: number;
  skatt?: number;
  nettolön?: number;
  socialaAvgifter?: number;
  lönekostnad?: number;
  grundlön?: number;
  extraradsSumma?: number;
  övertid?: number;
  timlön?: number;
  daglön?: number;
  skattunderlag?: number;
  dagavdrag?: {
    föräldraledighet: number;
    vårdAvSjuktBarn: number;
    sjukfrånvaro: number;
    totalt: number;
  };
  [key: string]:
    | number
    | {
        föräldraledighet: number;
        vårdAvSjuktBarn: number;
        sjukfrånvaro: number;
        totalt: number;
      }
    | undefined;
}

// Anstallda.tsx
export interface AnställdFlikProps {
  anställd: AnställdData;
  onTaBort: (id: number, namn: string) => void;
}

export interface AnställdaListaHandlers {
  hanteraAnställdKlick: (anställdId: number) => void;
  taBortAnställdFrånLista: (anställdId: number) => void;
}

export interface AnställdaRadPropsWithHandlers {
  anställd: AnställdListItem;
  handlers: AnställdaListaHandlers;
}

export interface InformationProps {
  state: {
    valdAnställd: AnställdData | null;
    personalIsEditing: boolean;
    personalHasChanges: boolean;
    personalErrorMessage: string | null;
    personalEditData: PersonalEditData;
    [key: string]: unknown;
  };
  handlers: {
    personalOnEdit: () => void;
    personalOnSave: () => void | Promise<void>;
    personalOnCancel: () => void;
    personalOnChange: (
      name: keyof PersonalEditData | string,
      value: string | number | boolean
    ) => void;
    [key: string]: unknown;
  };
}

export interface NyAnstalldHandlers {
  döljNyAnställd: () => void;
  hanteraNyAnställdSparad: () => Promise<void> | void;
}

export interface NyAnstalldProps {
  handlers: NyAnstalldHandlers;
}

export interface NyAnstalldModalProps {
  isOpen: boolean;
  onClose: () => void;
  handlers: NyAnstalldHandlers;
}

export interface AnställdaListaProps {
  state: {
    anställda: AnställdListItem[];
  };
  handlers: AnställdaListaHandlers;
}

// NyAnstalldModal.tsx
// ExtraraderModal.tsx
export interface FormField {
  name: string;
  value: string | null | undefined;
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  hidden?: boolean;
  type?: string;
  label?: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  step?: string;
  min?: string;
}

// Wizard.tsx
export interface WizardProps {
  steps: WizardStep[];
  lönekörningId?: number;
  onMarkeraFärdig?: (lönekörningId: number) => void;
}

// ============================================================================
// HOOK TYPES - Centralized from individual hook files
// ============================================================================

// useBokforing.ts
export interface UseBokforingProps {
  lönespec: Lönespec;
  extrarader: ExtraradData[];
  beräknadeVärden: BeräknadeVärden;
  anställdNamn: string;
  onBokfört?: () => void;
  onClose: () => void;
}

// useForhandsgranskning.ts
export interface MappedExtrarad {
  benämning: string;
  antal: string;
  kostnad: number;
  summa: number;
}

// useWizard.ts
type WizardStepStatus = "disabled" | "available" | "completed";

export interface WizardStep {
  id: string;
  title: string;
  description: string;
  buttonText: string;
  completed: boolean;
  enabled: boolean;
  status: WizardStepStatus;
  issues: string[];
  onClick: () => void;
}

export interface UseWizardProps {
  lönekörning: Lönekörning | null;
  onMaila: () => void;
  onBokför: () => void;
  onGenereraAGI: () => void;
  onBokförSkatter: () => void;
}

// useUtlagg.ts
export interface UseUtlaggProps {
  anställdId?: number | null;
  enableFlikMode?: boolean;
}

export interface UtläggBokföringModal {
  isOpen: boolean;
  utlägg: UtläggQueryResult | null;
  previewRows: UtlaggBokföringsRad[];
  loading: boolean;
}

// useSemester.ts
export interface UseSemesterProps {
  anställdId: number;
  anställdKompensation: number;
  userId: number;
}

export interface UseSemesterReturn {
  // State
  showBokforKnapp: boolean;
  summary: SemesterBoxSummary;
  prevSummary: SemesterBoxSummary | null;
  editingField: SemesterBoxField | null;
  editValue: string;
  loading: boolean;
  bokforModalOpen: boolean;
  bokforRows: BokföringsRad[];

  // Actions
  hamtaData: () => Promise<void>;
  handleEditField: (fieldName: SemesterBoxField, currentValue: number) => void;
  handleSaveEdit: () => Promise<void>;
  handleCancelEdit: () => void;
  handleOpenBokforModal: () => void;
  handleConfirmBokfor: (kommentar: string) => Promise<void>;
  setEditValue: (value: string) => void;
  setBokforModalOpen: (open: boolean) => void;
  clearToast: () => void;
}

// useAnstallda.ts
export interface UseAnstalldaProps {
  initialAnstallda?: AnställdData[];
  enableLonespecMode?: boolean;
  onLönespecUppdaterad?: () => void;
  enableNyAnstalldMode?: boolean;
  onNyAnstalldSaved?: () => void;
  onNyAnstalldCancel?: () => void;
}

// useMailaLonespec.ts
export interface ForhandsgranskningComponent {
  (props: {
    lönespec: Lönespec;
    anställd: AnställdListItem;
    företagsprofil: Företagsprofil | null;
    extrarader: ExtraradData[];
    beräknadeVärden: BeräknadeVärden;
    onStäng: () => void;
  }): React.JSX.Element | null;
}

export interface UseMailaLonespecProps {
  // Single mode only
  lönespec?: Lönespec;
  anställd?: AnställdListItem;
  företagsprofil?: Företagsprofil;
  extrarader?: ExtraradData[];
  beräknadeVärden?: BeräknadeVärden;
  open?: boolean;
  onClose?: () => void;
  onMailComplete?: () => void;
  ForhandsgranskningComponent: ForhandsgranskningComponent;
}

// useBankgiroExport.ts
export interface UseBankgiroExportProps {
  anställda: AnställdListItem[];
  utbetalningsdatum: Date | null;
  lönespecar: Record<string | number, Lönespec>;
  onExportComplete?: () => void;
  onClose?: () => void;
}

export interface UseLonespecProps {
  // Utlägg mode props
  enableUtlaggMode?: boolean;
  lönespecUtlägg?: Utlägg[];
  lönespecId?: number;
  anställdId?: number;
  onUtläggAdded?: (utlägg: Utlägg[], extraradResults: ExtraradResult[]) => Promise<void>;
  externaExtrarader?: ExtraradData[];

  // Component mode props
  enableComponentMode?: boolean;
  specificLönespec?: Lönespec;

  // New spec modal props
  enableNewSpecModal?: boolean;
  nySpecModalOpen?: boolean;
  nySpecDatum?: Date | null;
  setNySpecDatum?: (date: Date | null) => void;
  anstallda?: AnställdData[];
  onSpecCreated?: () => void;

  // Extrarader modal props
  enableExtraraderModal?: boolean;
  extraraderModalOpen?: boolean;
  extraraderModalTitle?: string;
  extraraderFields?: FormField[];
}
