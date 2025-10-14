import type { MutableRefObject } from "react";

// === BOKFÖRING TYPES ===
export interface BokföringPost {
  konto: string | number;
  debet: number;
  kredit: number;
  beskrivning?: string;
}

// === LEVERANTÖR TYPES ===
export type Leverantör = {
  id?: number;
  namn: string;
  organisationsnummer?: string;
  adress?: string;
  postnummer?: string;
  ort?: string;
  telefon?: string;
  email?: string;
  skapad?: string;
  uppdaterad?: string;
};

export interface KundListItem {
  id: number;
  kundnamn: string;
  kundorgnummer?: string | null;
  kundnummer?: string | null;
  kundmomsnummer?: string | null;
  kundadress1?: string | null;
  kundpostnummer?: string | null;
  kundstad?: string | null;
  kundemail?: string | null;
  personnummer?: string | null;
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
  bankinfo?: string;
  logo?: string;
  logoWidth?: number;
}

export type FakturaFormData = {
  id: string;
  fakturanummer: string;
  fakturadatum: string;
  forfallodatum: string;
  betalningsmetod: string;
  betalningsvillkor: string;
  drojsmalsranta: string;
  kundId: string;
  nummer: string;
  personnummer?: string;
  fastighetsbeteckning?: string;
  rotBoendeTyp?: "fastighet" | "brf";
  brfOrganisationsnummer?: string;
  brfLagenhetsnummer?: string;

  // Kunduppgifter
  kundnamn: string;
  kundnummer: string;
  kundorganisationsnummer: string;
  kundmomsnummer: string;
  kundadress: string;
  kundpostnummer: string;
  kundstad: string;
  kundemail: string;

  // Avsändare
  företagsnamn: string;
  adress: string;
  postnummer: string;
  stad: string;
  organisationsnummer: string;
  momsregistreringsnummer: string;
  telefonnummer: string;
  bankinfo: string;
  epost: string;
  webbplats: string;
  logo: string;
  logoWidth?: number;

  rotRutAktiverat?: boolean;
  rotRutTyp?: "ROT" | "RUT";
  rotRutKategori?: string;
  avdragProcent?: number;
  avdragBelopp?: number;
  arbetskostnadExMoms?: number | string;
  materialkostnadExMoms?: number | string;
  rotRutBeskrivning?: string;
  rotRutStartdatum?: string;
  rotRutSlutdatum?: string;

  artiklar: Artikel[];
};

export type Artikel = {
  beskrivning: string;
  antal: number;
  prisPerEnhet: number;
  moms: number;
  valuta: string;
  typ: "tjänst" | "vara";
  rotRutMaterial?: boolean;
  rotRutTyp?: "ROT" | "RUT";
  rotRutKategori?: string;
  avdragProcent?: number;
  arbetskostnadExMoms?: number;
  rotRutAntalTimmar?: number;
  rotRutPrisPerTimme?: number;
  rotRutBeskrivning?: string;
  rotRutStartdatum?: string;
  rotRutSlutdatum?: string;
  rotRutPersonnummer?: string;
  rotRutFastighetsbeteckning?: string;
  rotRutBoendeTyp?: string;
  rotRutBrfOrg?: string;
  rotRutBrfLagenhet?: string;
  ursprungligFavoritId?: number;
};

export type NyArtikel = {
  beskrivning: string;
  antal: string;
  prisPerEnhet: string;
  moms: string;
  valuta: string;
  typ: "tjänst" | "vara";
};

export type FavoritArtikel = Omit<
  Artikel,
  | "arbetskostnadExMoms"
  | "rotRutAntalTimmar"
  | "rotRutPrisPerTimme"
  | "rotRutStartdatum"
  | "rotRutSlutdatum"
> & {
  id?: number;
  användareId?: string;
  arbetskostnadExMoms?: number | string;
  rotRutAntalTimmar?: number | string;
  rotRutPrisPerTimme?: number | string;
  rotRutStartdatum?: string | Date;
  rotRutSlutdatum?: string | Date;
};

export interface FavoritArtikelRow {
  id: number;
  beskrivning: string;
  antal: number | string;
  pris_per_enhet: number | string;
  moms: number | string;
  valuta: string;
  typ: string;
  rot_rut_typ: string | null;
  rot_rut_kategori: string | null;
  avdrag_procent: number | string | null;
  arbetskostnad_ex_moms: number | string | null;
  rot_rut_beskrivning: string | null;
  rot_rut_startdatum: string | null;
  rot_rut_slutdatum: string | null;
  rot_rut_personnummer: string | null;
  rot_rut_fastighetsbeteckning: string | null;
  rot_rut_boende_typ: string | null;
  rot_rut_brf_org: string | null;
  rot_rut_brf_lagenhet: string | null;
}

export interface ArtikelInput {
  beskrivning: string;
  antal: number;
  prisPerEnhet: number;
  moms: number;
  valuta?: string;
  typ?: string;
  rotRutTyp?: string | null;
  rotRutKategori?: string | null;
  avdragProcent?: number | null;
  arbetskostnadExMoms?: number | null;
  rotRutBeskrivning?: string | null;
  rotRutStartdatum?: string | null;
  rotRutSlutdatum?: string | null;
  rotRutPersonnummer?: string | null;
  rotRutFastighetsbeteckning?: string | null;
  rotRutBoendeTyp?: string | null;
  rotRutBrfOrg?: string | null;
  rotRutBrfLagenhet?: string | null;
}

export type KundStatus = "none" | "loaded" | "editing" | "sparad";

// Server data types
export type ServerData = {
  foretagsprofil?: Partial<Företagsprofil>;
  kunder?: KundListItem[];
  artiklar?: FavoritArtikel[];
};

// Navigation types
export type ViewType = "menu" | "sparade" | "leverantorsfakturor" | "ny";

export type NavigationState = {
  currentView: ViewType;
  editFakturaId?: number;
};

// UI state types
export type ToastType = "success" | "error" | "info";

// Form types
export type AvsandareForm = {
  företagsnamn: string;
  adress: string;
  postnummer: string;
  stad: string;
  organisationsnummer: string;
  momsregistreringsnummer: string;
  telefonnummer: string;
  epost: string;
  webbplats: string;
  logo: string;
  logoWidth: number;
};

export type KundSaveResponse = {
  success: boolean;
  id?: number;
  kundId?: number;
  error?: string;
};

// Component props types
export interface NyFakturaClientProps {
  initialData: ServerData;
}

// Preview state type
export type PreviewState = {
  showPreview: boolean;
  setShowPreview: (show: boolean) => void;
};

// ProdukterTjanster Component Props Types
export interface ArtikelFormProps {
  beskrivning: string;
  antal: number;
  prisPerEnhet: number;
  moms: number;
  typ: "vara" | "tjänst";
  rotRutMaterial?: boolean;
  onChangeBeskrivning: (v: string) => void;
  onChangeAntal: (v: number) => void;
  onChangePrisPerEnhet: (v: number) => void;
  onChangeMoms: (v: number) => void;
  onChangeTyp: (v: "vara" | "tjänst") => void;
  onChangeRotRutMaterial?: (v: boolean) => void;
  disabled?: boolean;
}

export interface RotRutFormProps {
  showCheckbox?: boolean;
  disabled?: boolean;
}

export interface RotRutCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  labelClassName?: string;
}

export interface LäggTillFavoritartikelProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  labelClassName?: string;
}

// Sparade fakturor types
export interface SparadFaktura {
  id: number;
  fakturanummer: string;
  fakturadatum: string | Date | null;
  kundId: number | null;
  status_betalning: string | null;
  status_bokförd: string | null;
  betaldatum: string | Date | null;
  transaktions_id: number | null;
  rot_rut_status: string | null;
  typ: string;
  kundnamn: string | null;
  totalBelopp: number;
  antalArtiklar: number;
  rotRutTyp: "ROT" | "RUT" | "ROT+RUT" | null;
}

export interface SparadeProps {
  onBackToMenu?: () => void;
  onEditFaktura?: (fakturaId: number) => void;
}

export interface SparadeFakturorProps {
  fakturor: SparadFaktura[];
  activeInvoiceId?: number;
  onSelectInvoice?: (id: number) => void | Promise<void>;
}

export interface BetalningsModal {
  fakturaId: number;
  belopp: number;
}

// Email functionality types
export interface SkickaEpostProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

// Leverantör types
export interface VäljLeverantörModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface NavigationParams {
  leverantorId: number | string;
  levfakt?: boolean;
}

// Verifikat types
export type TransaktionsPost = {
  id: number;
  kontonummer: string;
  kontobeskrivning: string;
  debet: number;
  kredit: number;
  transaktionsdatum: string;
  transaktionskommentar: string;
};

export interface VerifikatModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaktionId: number;
  fakturanummer?: string;
  leverantör?: string;
}

export interface UseVerifikatModalProps {
  isOpen: boolean;
  transaktionId: number;
  fakturanummer?: string;
  leverantör?: string;
}

// Sparade types
export interface FakturorComponentProps {
  initialFakturor: SparadFaktura[];
}

export interface UseSparadeFakturorReturn {
  hanteraValdFaktura: (fakturaId: number) => Promise<void>;
}

export interface SparadeFakturorPageData {
  kunder: KundListItem[];
  fakturor: SparadFaktura[];
  artiklar: FavoritArtikel[];
}

export interface UseSparadeFakturorPageReturn {
  data: SparadeFakturorPageData | null;
  loading: boolean;
  loadData: () => Promise<void>;
}

// Forhandsgranskning subcomponent types
export interface ArtiklarListaProps {
  rows: Artikel[];
}

export interface AvsändMottagProps {
  formData: FakturaFormData;
}

export interface BetalningsInfoProps {
  formData: FakturaFormData;
  summaAttBetala: number;
}

export interface FotProps {
  formData: FakturaFormData;
  session: unknown;
}

export interface LogotypProps {
  logo?: string;
  logoSize?: number;
  logoSliderValue?: number;
  setLogoSliderValue?: (value: number) => void;
  showSlider?: boolean;
}

export interface RotRutInfoProps {
  formData: FakturaFormData;
  beraknatAvdrag?: number;
}

export interface TotalerInfoProps {
  sumExkl: number;
  totalMoms: number;
  rotRutAvdrag: number;
  summaAttBetala: number;
  valuta?: string;
  rotRutTyp?: "ROT" | "RUT";
}

// Forhandsgranskning hook types
export interface ForhandsgranskningCalculations {
  // Data och logik
  rows: Artikel[];
  logoSliderValue: number;
  handleLogoSliderChange: (value: number) => void;
  logoSize: number;

  // Grundläggande summor
  sumExkl: number;
  sumMoms: number; // Legacy kompatibilitet
  sumInkl: number; // Legacy kompatibilitet
  totalMoms: number;

  // ROT/RUT-relaterat
  harROTRUTArtiklar: boolean;
  rotRutTyp: string | undefined;
  rotRutTjänsterSumExkl: number;
  rotRutTjänsterMoms: number;
  rotRutTjänsterInklMoms: number;
  arbetskostnadInklMoms: number;
  rotRutAvdrag: number;

  // ROT/RUT display data
  rotRutPersonnummer: string | undefined;
  rotRutTotalTimmar: number;
  rotRutGenomsnittsPris: number;
  rotRutAvdragProcent: string;
  shouldShowRotRut: boolean;

  // Slutsummor
  totalSum: number;
  summaAttBetala: number;
}

// =============================================================================
// LEVERANTÖRER TYPES
// =============================================================================
export interface LeverantorFlikProps {
  onLeverantörUpdated?: () => void;
}

export interface BekraftaBorttagnngModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  leverantorNamn: string;
  loading?: boolean;
}

export interface NyLeverantorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  editLeverantör?: Leverantör;
}

export interface UseLeverantorFlikReturn {
  // State
  leverantörer: Leverantör[];
  loading: boolean;
  showModal: boolean;
  editLeverantör: Leverantör | undefined;
  deleteModal: { show: boolean; leverantör?: Leverantör };
  deleteLoading: boolean;
  bokförModal: { show: boolean; leverantör?: Leverantör };

  // Actions
  loadLeverantörer: () => Promise<void>;
  handleLeverantörAdded: () => void;
  handleEditLeverantör: (leverantör: Leverantör) => void;
  handleDeleteLeverantör: (leverantör: Leverantör) => void;
  handleBokförLeverantör: (leverantör: Leverantör) => void;
  confirmDelete: () => Promise<void>;
  handleModalClose: () => void;
  setShowModal: (show: boolean) => void;
  setDeleteModal: (modal: { show: boolean; leverantör?: Leverantör }) => void;
  setBokförModal: (modal: { show: boolean; leverantör?: Leverantör }) => void;
}

export interface UseNyLeverantorModalReturn {
  // State
  loading: boolean;
  error: string | null;
  formData: LeverantörFormData;
  isEditing: boolean;

  // Actions
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  setError: (error: string | null) => void;
}

// Hook parameter interfaces
export interface UseLeverantörerReturn {
  leverantörer: Leverantör[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  harLeverantörer: boolean;
}

export interface UseLeverantorFlikParams {
  onLeverantörUpdated?: () => void;
}

export interface UseNyLeverantorModalParams {
  isOpen: boolean;
  editLeverantör?: Leverantör;
  onSaved: () => void;
  onClose: () => void;
}

export interface UseValjLeverantorModalParams {
  isOpen: boolean;
  onClose: () => void;
}

export interface UseValjLeverantorModalReturn {
  // State
  selectedLeverantör: number | null;

  // Actions
  setSelectedLeverantör: (id: number | null) => void;
  handleContinue: () => void;
}

// =============================================================================
// LEVERANTÖRSFAKTUROR TYPES
// =============================================================================
export interface UseBokfordaFakturorFlikReturn {
  // State
  fakturorAntal: number;
  loading: boolean;

  // Actions
  loadFakturorAntal: () => Promise<void>;
}

// Bokför Faktura Modal types
export interface BokforFakturaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface BokforingsPost {
  konto: string;
  kontoNamn: string;
  debet: number;
  kredit: number;
  beskrivning: string;
}

// Alternativ component types
export interface AlternativProps {
  onReload: () => void;
  onPreview: () => void;
}

// Betalning component types
export type BetalningProps = Record<string, never>;

// BetalningsbekraftelseModal component types
export type BetalningsPost = {
  konto: string;
  kontoNamn: string;
  debet: number;
  kredit: number;
};

export interface BetalningsbekräftelseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  leverantör: string;
  fakturanummer: string;
  belopp: number;
}

export interface UseBetalningsbekraftelseModalProps {
  leverantör: string;
  fakturanummer: string;
  belopp: number;
}

// BokfordaFakturor component types
export type BokfordFaktura = {
  id: number; // leverantörsfaktura.id
  transaktionId?: number; // transaktion.id för verifikat
  datum: string | Date;
  belopp: number;
  kommentar: string;
  leverantör?: string;
  leverantor_id?: number;
  leverantorId?: number;
  fakturanummer?: string;
  fakturadatum?: string;
  förfallodatum?: string;
  betaldatum?: string;
  status_betalning?: string;
  status_bokförd?: string;
};

// FramsidaKnapp component types
export interface FakturaKnappProps {
  emoji: string;
  title: string;
  description: string;
  href: string;
}

// ExporteraPDFKnapp component types
export interface ExporteraPDFKnappProps {
  disabled?: boolean;
  text?: string;
  className?: string;
}

// Bokföring types
export interface BokföringsPost {
  konto: string;
  kontoNamn: string;
  debet: number;
  kredit: number;
  beskrivning: string;
}

export interface BokförFakturaData {
  fakturaId: number;
  fakturanummer: string;
  kundnamn: string;
  totaltBelopp: number;
  poster: BokföringPost[];
  kommentar: string;
}

// === PDF GENERATION ===
export interface PDFGenerationOptions {
  elementId?: string;
  scale?: number;
  quality?: number;
  backgroundColor?: string;
}

// === ROT/RUT BETALNING ===
export interface RotRutBetalningModalProps {
  isOpen: boolean;
  onClose: () => void;
  fakturaId: number;
  fakturanummer: string;
  kundnamn: string;
  totalBelopp: number;
  bokföringsmetod: string;
  onSuccess: (nyStatus: { rot_rut_status: string; status_betalning: string }) => void;
}

export type RotRutStatusPayload = Parameters<RotRutBetalningModalProps["onSuccess"]>[0];

export type UseRotRutOptions = Pick<
  RotRutBetalningModalProps,
  "fakturaId" | "totalBelopp" | "bokföringsmetod" | "onSuccess" | "onClose"
>;

// === HUS FIL GENERATION ===
export interface HUSFilData {
  fakturanummer: string;
  kundPersonnummer: string;
  betalningsdatum: string;
  prisForArbete: number;
  betaltBelopp: number;
  begartBelopp: number;
  rotRutTyp: "ROT" | "RUT";
  rotRutKategori: string;
  fastighetsbeteckning?: string;
  lägenhetsNummer?: string;
  brfOrgNummer?: string;
  antalTimmar?: number;
  materialKostnad?: number;
}

export interface FakturaArtikelState {
  nyArtikel: NyArtikel;
  favoritArtiklar: FavoritArtikel[];
  showFavoritArtiklar: boolean;
  blinkIndex: number | null;
  visaRotRutForm: boolean;
  visaArtikelForm: boolean;
  visaArtikelModal: boolean;
  redigerarIndex: number | null;
  favoritArtikelVald: boolean;
  ursprungligFavoritId: number | null;
  artikelSparadSomFavorit: boolean;
  valtArtikel: FavoritArtikel | null;
  showDeleteFavoritModal: boolean;
  deleteFavoritId: number | null;
}

export interface FakturaArtikelContextValue {
  state: FakturaArtikelState;
  setState: (updates: Partial<FakturaArtikelState>) => void;
  setNyArtikel: (updates: Partial<NyArtikel>) => void;
  resetNyArtikel: () => void;
  setFavoritArtiklar: (artiklar: FavoritArtikel[]) => void;
  resetState: () => void;
}

export type FakturaArtikelAction =
  | { type: "SET_STATE"; payload: Partial<FakturaArtikelState> }
  | { type: "RESET_STATE" }
  | { type: "SET_NY_ARTIKEL"; payload: Partial<NyArtikel> }
  | { type: "RESET_NY_ARTIKEL" }
  | { type: "SET_FAVORIT_ARTIKLAR"; payload: FavoritArtikel[] };

export interface FakturaArtikelProviderProps {
  children: React.ReactNode;
  initialFavoritArtiklar?: FavoritArtikel[];
}

export interface LeverantörFormData {
  namn: string;
  organisationsnummer?: string;
  adress?: string;
  postnummer?: string;
  stad?: string;
  telefon?: string;
  epost?: string;
}

export interface BokföringsData {
  fakturanummer: string;
  kundnamn: string;
  poster: BokforingsPost[];
  totaltBelopp: number;
}

// === CONTEXT TYPES ===
export interface FakturaState {
  kundStatus: KundStatus;
  navigationState: NavigationState;
  userSettings: {
    bokföringsmetod: "kontantmetoden" | "fakturametoden";
  };
}

// Håller reda på engångsguards som delas mellan alla `useFaktura`-instanser
// så att init-logik bara körs när det verkligen behövs.
// Dessa flaggor används för att styra engångslogik (defaults, autofyll osv.)
// och delas mellan alla komponenter via context för att undvika loopar.
export interface FakturaLifecycleFlags {
  lastDefaultsSessionId: string | null;
  harInitDefaults: boolean;
  harAutoBeraknatForfallo: boolean;
  harLastatForetagsprofil: boolean;
  harLastatKunder: boolean;
  harLastatFavoritArtiklar: boolean;
  harInitNyFaktura: boolean;
}

export type FakturaFormAction =
  | { type: "SET_FORM_DATA"; payload: Partial<FakturaFormData> }
  | { type: "RESET_FORM_DATA" }
  | { type: "HYDRATE_FORM_DATA"; payload: Partial<FakturaFormData> };

export type FakturaFormSelector<T> = (state: FakturaFormData) => T;

export interface FakturaFormContextValue {
  getSnapshot: () => FakturaFormData;
  subscribe: (listener: () => void) => () => void;
  setFormData: (updates: Partial<FakturaFormData>) => void;
  resetFormData: () => void;
  hydrateFromServer: (data: ServerData) => void;
  lifecycle: MutableRefObject<FakturaLifecycleFlags>;
}

export interface FakturaFormProviderProps {
  children: React.ReactNode;
  initialData?: ServerData;
}

export type FakturaAction =
  | { type: "SET_KUND_STATUS"; payload: KundStatus }
  | { type: "RESET_KUND" }
  | { type: "SET_NAVIGATION"; payload: Partial<NavigationState> }
  | { type: "NAVIGATE_TO_VIEW"; payload: ViewType }
  | { type: "NAVIGATE_TO_EDIT"; payload: { view: ViewType; fakturaId?: number } }
  | { type: "NAVIGATE_BACK" }
  | { type: "SET_TOAST"; payload: { message: string; type: "success" | "error" | "info" } }
  | { type: "CLEAR_TOAST" }
  | { type: "SET_BOKFÖRINGSMETOD"; payload: "kontantmetoden" | "fakturametoden" };

export type FakturaDispatch = React.Dispatch<FakturaAction>;

export interface FakturaContextType {
  state: FakturaState;
  dispatch: FakturaDispatch;
  // Helper actions - samma API som Zustand store
  setKundStatus: (status: KundStatus) => void;
  resetKund: () => void;
  setNavigation: (navigation: Partial<NavigationState>) => void;
  navigateToView: (view: ViewType) => void;
  navigateToEdit: (view: ViewType, fakturaId?: number) => void;
  navigateBack: () => void;
  setBokföringsmetod: (metod: "kontantmetoden" | "fakturametoden") => void;
}

export interface FakturaProviderProps {
  children: React.ReactNode;
  initialData?: ServerData;
}

export interface FakturaContextInnerProps {
  children: React.ReactNode;
}

export interface NyFakturaProps {
  onBackToMenu: () => void;
}
