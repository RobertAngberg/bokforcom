import { create } from "zustand";

// ===== TYPES =====

export interface Artikel {
  id: string;
  beskrivning: string;
  antal: number;
  prisPerEnhet: number;
  moms: number;
  valuta: string;
  typ: "vara" | "tjänst";
  rotRutMaterial?: boolean;
  totalt: number;
  momssumma: number;
}

export interface FavoritArtikel {
  id: number;
  namn: string;
  beskrivning: string;
  pris: number;
  momssats: number;
}

export interface Leverantör {
  id: number;
  namn: string;
  organisationsnummer?: string;
  adress?: string;
  postnummer?: string;
  stad?: string;
  telefon?: string;
  email?: string;
  webbplats?: string;
  kontaktperson?: string;
  betalningsvillkor?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BokfordFaktura {
  id: number;
  fakturanummer: string;
  leverantör: string;
  belopp: number;
  fakturadatum: string;
  förfallodatum: string;
  betaldatum?: string;
  status: string;
  beskrivning?: string;
  fil_url?: string;
}

export interface FakturaData {
  // Faktura metadata
  id: string;
  fakturanummer: string;
  fakturadatum: string;
  forfallodatum: string;
  betalningsmetod: string;
  betalningsvillkor: string;
  drojsmalsranta: string;

  // Kund
  kundId: string;
  kundnamn: string;
  kundnummer: string;
  kundorganisationsnummer: string;
  kundmomsnummer: string;
  kundadress: string;
  kundpostnummer: string;
  kundstad: string;
  kundemail: string;
  nummer: string;
  personnummer?: string;

  // Avsändare/Företag
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
  logoWidth: number;

  // ROT/RUT
  rotRutAktiverat: boolean;
  rotRutTyp?: "ROT" | "RUT";
  rotRutKategori?: string;
  avdragProcent?: number;
  avdragBelopp?: number;
  arbetskostnadExMoms?: number;
  materialkostnadExMoms?: number;
  fastighetsbeteckning?: string;
  rotBoendeTyp?: "fastighet" | "brf";
  brfOrganisationsnummer?: string;
  brfLagenhetsnummer?: string;

  // Artiklar
  artiklar: Artikel[];
}

export interface NyArtikel {
  beskrivning: string;
  antal: string;
  prisPerEnhet: string;
  moms: string;
  valuta: string;
  typ: "vara" | "tjänst";
  rotRutMaterial?: boolean;
}

export type KundStatus = "none" | "editing" | "loaded";

export interface Toast {
  show: boolean;
  message: string;
  type: "success" | "error" | "info";
}

export interface Modals {
  nyLeverantör: boolean;
  editLeverantör: { show: boolean; leverantör?: Leverantör };
  deleteLeverantör: { show: boolean; leverantör?: Leverantör };
  verifikat: { show: boolean; faktura?: BokfordFaktura };
  betalningsbekräftelse: { show: boolean; faktura?: BokfordFaktura };
  förtydligande: boolean;
}

export interface LoadingStates {
  faktura: boolean;
  leverantörer: boolean;
  bokfordaFakturor: boolean;
  saving: boolean;
  deleting: boolean;
  artiklar: boolean;
}

// ===== STORE INTERFACE =====

interface FakturaStore {
  // === STATE ===
  fakturaData: FakturaData;
  nyArtikel: NyArtikel;
  kundStatus: KundStatus;
  showPreview: boolean;
  favoritArtiklar: FavoritArtikel[];
  leverantörer: Leverantör[];
  selectedLeverantör: Leverantör | null;
  bokfordaFakturor: BokfordFaktura[];
  modals: Modals;
  loading: LoadingStates;
  toast: Toast;

  // === ACTIONS ===
  setFakturaData: (data: Partial<FakturaData>) => void;
  resetFaktura: () => void;
  setKundData: (kund: Partial<FakturaData>) => void;
  resetKund: () => void;
  setKundStatus: (status: KundStatus) => void;
  addArtikel: (artikel: Artikel) => void;
  updateArtikel: (index: number, artikel: Partial<Artikel>) => void;
  removeArtikel: (index: number) => void;
  setNyArtikel: (artikel: Partial<NyArtikel>) => void;
  resetNyArtikel: () => void;
  setFavoritArtiklar: (artiklar: FavoritArtikel[]) => void;
  setLeverantörer: (leverantörer: Leverantör[]) => void;
  addLeverantör: (leverantör: Leverantör) => void;
  updateLeverantör: (id: number, leverantör: Partial<Leverantör>) => void;
  removeLeverantör: (id: number) => void;
  setSelectedLeverantör: (leverantör: Leverantör | null) => void;
  setBokfordaFakturor: (fakturor: BokfordFaktura[]) => void;
  addBokfordFaktura: (faktura: BokfordFaktura) => void;
  updateBokfordFaktura: (id: number, faktura: Partial<BokfordFaktura>) => void;
  removeBokfordFaktura: (id: number) => void;
  setShowPreview: (show: boolean) => void;
  setLoading: (key: keyof LoadingStates, loading: boolean) => void;
  showToast: (message: string, type: Toast["type"]) => void;
  hideToast: () => void;
  openModal: (modal: keyof Modals, data?: any) => void;
  closeModal: (modal: keyof Modals) => void;
  closeAllModals: () => void;
  toggleRotRut: () => void;
  setRotRutData: (data: Partial<FakturaData>) => void;
}

// ===== DEFAULT VALUES =====

const defaultFakturaData: FakturaData = {
  id: "",
  fakturanummer: "",
  fakturadatum: new Date().toISOString().split("T")[0],
  forfallodatum: "",
  betalningsmetod: "",
  betalningsvillkor: "",
  drojsmalsranta: "",
  kundId: "",
  nummer: "",
  kundnamn: "",
  kundnummer: "",
  kundorganisationsnummer: "",
  kundmomsnummer: "",
  kundadress: "",
  kundpostnummer: "",
  kundstad: "",
  kundemail: "",
  företagsnamn: "",
  epost: "",
  adress: "",
  postnummer: "",
  stad: "",
  organisationsnummer: "",
  momsregistreringsnummer: "",
  telefonnummer: "",
  bankinfo: "",
  webbplats: "",
  logo: "",
  logoWidth: 200,
  rotRutAktiverat: false,
  rotRutTyp: undefined,
  rotRutKategori: undefined,
  avdragProcent: undefined,
  avdragBelopp: undefined,
  arbetskostnadExMoms: undefined,
  materialkostnadExMoms: undefined,
  personnummer: "",
  fastighetsbeteckning: "",
  rotBoendeTyp: undefined,
  brfOrganisationsnummer: "",
  brfLagenhetsnummer: "",
  artiklar: [],
};

const defaultNyArtikel: NyArtikel = {
  beskrivning: "",
  antal: "",
  prisPerEnhet: "",
  moms: "25",
  valuta: "SEK",
  typ: "tjänst",
  rotRutMaterial: false,
};

const defaultModals: Modals = {
  nyLeverantör: false,
  editLeverantör: { show: false },
  deleteLeverantör: { show: false },
  verifikat: { show: false },
  betalningsbekräftelse: { show: false },
  förtydligande: false,
};

const defaultLoading: LoadingStates = {
  faktura: false,
  leverantörer: false,
  bokfordaFakturor: false,
  saving: false,
  deleting: false,
  artiklar: false,
};

const defaultToast: Toast = {
  show: false,
  message: "",
  type: "info",
};

// ===== STORE IMPLEMENTATION =====

export const useFakturaStore = create<FakturaStore>((set, get) => ({
  // === INITIAL STATE ===
  fakturaData: defaultFakturaData,
  nyArtikel: defaultNyArtikel,
  kundStatus: "none",
  showPreview: false,
  favoritArtiklar: [],
  leverantörer: [],
  selectedLeverantör: null,
  bokfordaFakturor: [],
  modals: defaultModals,
  loading: defaultLoading,
  toast: defaultToast,

  // === FAKTURA ACTIONS ===
  setFakturaData: (data) =>
    set((state) => ({
      fakturaData: { ...state.fakturaData, ...data },
    })),

  resetFaktura: () =>
    set({
      fakturaData: defaultFakturaData,
      nyArtikel: defaultNyArtikel,
      kundStatus: "none",
      showPreview: false,
    }),

  // === KUND ACTIONS ===
  setKundData: (kund) =>
    set((state) => ({
      fakturaData: { ...state.fakturaData, ...kund },
    })),

  resetKund: () =>
    set((state) => ({
      fakturaData: {
        ...state.fakturaData,
        kundId: "",
        kundnamn: "",
        kundnummer: "",
        kundorganisationsnummer: "",
        kundmomsnummer: "",
        kundadress: "",
        kundpostnummer: "",
        kundstad: "",
        kundemail: "",
      },
      kundStatus: "editing",
    })),

  setKundStatus: (status) => set({ kundStatus: status }),

  // === ARTIKEL ACTIONS ===
  addArtikel: (artikel) =>
    set((state) => ({
      fakturaData: {
        ...state.fakturaData,
        artiklar: [...state.fakturaData.artiklar, artikel],
      },
    })),

  updateArtikel: (index, artikel) =>
    set((state) => ({
      fakturaData: {
        ...state.fakturaData,
        artiklar: state.fakturaData.artiklar.map((a, i) =>
          i === index ? { ...a, ...artikel } : a
        ),
      },
    })),

  removeArtikel: (index) =>
    set((state) => ({
      fakturaData: {
        ...state.fakturaData,
        artiklar: state.fakturaData.artiklar.filter((_, i) => i !== index),
      },
    })),

  setNyArtikel: (artikel) =>
    set((state) => ({
      nyArtikel: { ...state.nyArtikel, ...artikel },
    })),

  resetNyArtikel: () => set({ nyArtikel: defaultNyArtikel }),

  setFavoritArtiklar: (artiklar) => set({ favoritArtiklar: artiklar }),

  // === LEVERANTÖR ACTIONS ===
  setLeverantörer: (leverantörer) => set({ leverantörer }),

  addLeverantör: (leverantör) =>
    set((state) => ({
      leverantörer: [...state.leverantörer, leverantör],
    })),

  updateLeverantör: (id, leverantör) =>
    set((state) => ({
      leverantörer: state.leverantörer.map((l) => (l.id === id ? { ...l, ...leverantör } : l)),
    })),

  removeLeverantör: (id) =>
    set((state) => ({
      leverantörer: state.leverantörer.filter((l) => l.id !== id),
    })),

  setSelectedLeverantör: (leverantör) => set({ selectedLeverantör: leverantör }),

  // === BOKFÖRDA FAKTUROR ACTIONS ===
  setBokfordaFakturor: (fakturor) => set({ bokfordaFakturor: fakturor }),

  addBokfordFaktura: (faktura) =>
    set((state) => ({
      bokfordaFakturor: [...state.bokfordaFakturor, faktura],
    })),

  updateBokfordFaktura: (id, faktura) =>
    set((state) => ({
      bokfordaFakturor: state.bokfordaFakturor.map((f) => (f.id === id ? { ...f, ...faktura } : f)),
    })),

  removeBokfordFaktura: (id) =>
    set((state) => ({
      bokfordaFakturor: state.bokfordaFakturor.filter((f) => f.id !== id),
    })),

  // === UI ACTIONS ===
  setShowPreview: (show) => set({ showPreview: show }),

  setLoading: (key, loading) =>
    set((state) => ({
      loading: { ...state.loading, [key]: loading },
    })),

  showToast: (message, type) =>
    set({
      toast: { show: true, message, type },
    }),

  hideToast: () =>
    set({
      toast: defaultToast,
    }),

  // === MODAL ACTIONS ===
  openModal: (modal, data) =>
    set((state) => ({
      modals: {
        ...state.modals,
        [modal]: data ? { show: true, ...data } : true,
      },
    })),

  closeModal: (modal) =>
    set((state) => ({
      modals: {
        ...state.modals,
        [modal]: typeof state.modals[modal] === "object" ? { show: false } : false,
      },
    })),

  closeAllModals: () => set({ modals: defaultModals }),

  // === ROT/RUT ACTIONS ===
  toggleRotRut: () =>
    set((state) => ({
      fakturaData: {
        ...state.fakturaData,
        rotRutAktiverat: !state.fakturaData.rotRutAktiverat,
      },
    })),

  setRotRutData: (data) =>
    set((state) => ({
      fakturaData: { ...state.fakturaData, ...data },
    })),
}));

// ===== HELPFUL SELECTORS =====

export const fakturaSelectors = {
  fakturaData: (state: FakturaStore) => state.fakturaData,
  artiklar: (state: FakturaStore) => state.fakturaData.artiklar,
  isRotRutActive: (state: FakturaStore) => state.fakturaData.rotRutAktiverat,
  leverantörer: (state: FakturaStore) => state.leverantörer,
  selectedLeverantör: (state: FakturaStore) => state.selectedLeverantör,
  isLoading: (key: keyof LoadingStates) => (state: FakturaStore) => state.loading[key],
  toast: (state: FakturaStore) => state.toast,
  modals: (state: FakturaStore) => state.modals,
};

// USAGE EXAMPLES:
// const { fakturaData, setFakturaData } = useFakturaStore();
// const artiklar = useFakturaStore(fakturaSelectors.artiklar);
// const isLoadingLeverantörer = useFakturaStore(fakturaSelectors.isLoading('leverantörer'));
