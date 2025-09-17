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

export type KundStatus = "none" | "loaded" | "editing";

// Server data types
export type ServerData = {
  foretagsprofil?: {
    företagsnamn?: string;
    adress?: string;
    postnummer?: string;
    stad?: string;
    organisationsnummer?: string;
    momsregistreringsnummer?: string;
    telefonnummer?: string;
    epost?: string;
    bankinfo?: string;
    webbplats?: string;
  };
  kunder?: any[];
  artiklar?: FavoritArtikel[];
};

// UI state types
export type ToastType = "success" | "error" | "info";

export type ToastState = {
  message: string;
  type: ToastType;
  isVisible: boolean;
};

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
};

// Component props types
export interface NyFakturaClientProps {
  initialData: ServerData;
}

export interface FakturaStoreInitProps {
  initialData: ServerData;
}

// Preview state type
export type PreviewState = {
  showPreview: boolean;
  setShowPreview: (show: boolean) => void;
};

// Store interface
export interface FakturaStoreState {
  // State
  formData: FakturaFormData;
  kundStatus: KundStatus;
  nyArtikel: NyArtikel;

  // ProdukterTjanster state
  produkterTjansterState: {
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
  };

  // Toast state
  toastState: {
    message: string;
    type: "success" | "error" | "info";
    isVisible: boolean;
  };

  // User settings
  userSettings: {
    bokföringsmetod: "kontantmetoden" | "fakturametoden";
  };

  // Actions
  setFormData: (data: Partial<FakturaFormData>) => void;
  resetFormData: () => void;
  setKundStatus: (status: KundStatus) => void;
  resetKund: () => void;
  setNyArtikel: (artikel: Partial<NyArtikel>) => void;
  resetNyArtikel: () => void;

  // ProdukterTjanster actions
  setProdukterTjansterState: (state: Partial<FakturaStoreState["produkterTjansterState"]>) => void;
  resetProdukterTjanster: () => void;

  // Toast actions
  setToast: (toast: { message: string; type: "success" | "error" | "info" }) => void;
  clearToast: () => void;

  // User settings actions
  setBokföringsmetod: (metod: "kontantmetoden" | "fakturametoden") => void;

  // Init function för server data
  initStore: (data: ServerData) => void;
}

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

// SparadeFakturor types
export interface SparadeFakturorProps {
  fakturor: any[];
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
  initialFakturor: any[];
}

export interface UseSparadeFakturorReturn {
  hanteraValdFaktura: (fakturaId: number) => Promise<void>;
}

export interface UseSparadeFakturorPageReturn {
  data: { kunder: any[]; fakturor: any[]; artiklar: any[] } | null;
  loading: boolean;
  loadData: () => Promise<void>;
}

// Forhandsgranskning subcomponent types
export interface ArtiklarListaProps {
  rows: any[];
}

export interface AvsändMottagProps {
  formData: any;
}

export interface BetalningsInfoProps {
  formData: any;
  summaAttBetala: number;
}

export interface FotProps {
  formData: any;
  session: any;
}

export interface LogotypProps {
  logo?: string;
  logoSize?: number;
  logoSliderValue?: number;
  setLogoSliderValue?: (value: number) => void;
  showSlider?: boolean;
}

export interface RotRutInfoProps {
  formData: any;
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
  // Grundläggande summor
  sumExkl: number;
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

  // Logo-hantering
  logoSize: number;
  logoSliderValue: number;
  handleLogoSliderChange: (value: number) => void;
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
  editLeverantör?: any; // Import från actions.ts
}

export interface UseLeverantorFlikReturn {
  // State
  leverantörer: any[]; // Import från actions.ts
  loading: boolean;
  showModal: boolean;
  editLeverantör: any | undefined; // Import från actions.ts
  deleteModal: { show: boolean; leverantör?: any };
  deleteLoading: boolean;
  bokförModal: { show: boolean; leverantör?: any };

  // Actions
  loadLeverantörer: () => Promise<void>;
  handleLeverantörAdded: () => void;
  handleEditLeverantör: (leverantör: any) => void;
  handleDeleteLeverantör: (leverantör: any) => void;
  handleBokförLeverantör: (leverantör: any) => void;
  confirmDelete: () => Promise<void>;
  handleModalClose: () => void;
  setShowModal: (show: boolean) => void;
  setDeleteModal: (modal: { show: boolean; leverantör?: any }) => void;
  setBokförModal: (modal: { show: boolean; leverantör?: any }) => void;
}

export interface UseNyLeverantorModalReturn {
  // State
  loading: boolean;
  error: string | null;
  formData: {
    namn: string;
    organisationsnummer: string;
    adress: string;
    postnummer: string;
    stad: string;
    telefon: string;
    epost: string;
  };
  isEditing: boolean;

  // Actions
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  setError: (error: string | null) => void;
}

// Hook parameter interfaces
export interface UseLeverantörerReturn {
  leverantörer: any[]; // Leverantör från actions.ts
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
  editLeverantör?: any; // Leverantör från actions.ts
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
export interface BetalningProps {
  // För framtida props om behövs
}

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
