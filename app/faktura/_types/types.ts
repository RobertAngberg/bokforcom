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
};

export type NyArtikel = {
  beskrivning: string;
  antal: string;
  prisPerEnhet: string;
  moms: string;
  valuta: string;
  typ: "tjänst" | "vara";
};

export type FavoritArtikel = {
  id: string;
  beskrivning: string;
  prisPerEnhet: number;
  moms: number;
  valuta: string;
  typ: "tjänst" | "vara";
  användareId: string;
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

  // Actions
  setFormData: (data: Partial<FakturaFormData>) => void;
  resetFormData: () => void;
  setKundStatus: (status: KundStatus) => void;
  resetKund: () => void;
  setNyArtikel: (artikel: Partial<NyArtikel>) => void;
  resetNyArtikel: () => void;

  // Init function för server data
  initStore: (data: ServerData) => void;
}
