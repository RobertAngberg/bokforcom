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
