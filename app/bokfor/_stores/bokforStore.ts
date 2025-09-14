import { create } from "zustand";
import { Förval } from "../_types/types";

// Nu med ALLA formulärfält för att eliminera props drilling
interface BokforStore {
  // Navigation state
  currentStep: number;

  // Data & UI state
  favoritFörvalen: Förval[];
  levfaktMode: boolean;
  utlaggMode: boolean;

  // Formulärfält
  kontonummer: string;
  kontobeskrivning: string | null;
  belopp: number | null;
  kommentar: string | null;
  fil: File | null;
  pdfUrl: string | null;
  transaktionsdatum: string | null;
  valtFörval: Förval | null;
  extrafält: Record<string, { label: string; debet: number; kredit: number }>;

  // Leverantörsfaktura-fält
  leverantör: any | null;
  fakturanummer: string | null;
  fakturadatum: string | null;
  förfallodatum: string | null;
  betaldatum: string | null;
  bokförSomFaktura: boolean;
  kundfakturadatum: string | null;

  // Navigation actions
  setCurrentStep: (step: number) => void;
  setFavoritFörvalen: (förvalen: Förval[]) => void;
  setLevfaktMode: (mode: boolean) => void;
  setUtlaggMode: (mode: boolean) => void;
  handleSetCurrentStep: (
    step: number,
    router?: any,
    setIsLevfaktMode?: (value: boolean) => void,
    setLeverantör?: (value: any) => void
  ) => void;

  // Actions för alla formulärfält
  setKontonummer: (value: string) => void;
  setKontobeskrivning: (value: string | null) => void;
  setBelopp: (value: number | null) => void;
  setKommentar: (value: string | null) => void;
  setFil: (value: File | null) => void;
  setPdfUrl: (value: string | null) => void;
  setTransaktionsdatum: (value: string | null) => void;
  setValtFörval: (value: Förval | null) => void;
  setExtrafält: (value: Record<string, { label: string; debet: number; kredit: number }>) => void;

  // Leverantörsfaktura actions
  setLeverantör: (value: any | null) => void;
  setFakturanummer: (value: string | null) => void;
  setFakturadatum: (value: string | null) => void;
  setFörfallodatum: (value: string | null) => void;
  setBetaldatum: (value: string | null) => void;
  setBokförSomFaktura: (value: boolean) => void;
  setKundfakturadatum: (value: string | null) => void;

  // Utility för att återställa alla fält
  resetAllFields: () => void;

  // Business logic functions
  exitLevfaktMode: (router?: any) => void;

  // Initialisera store med server data
  initStore: (data: {
    favoritFörvalen: Förval[];
    levfaktMode: boolean;
    utlaggMode: boolean;
    currentStep: number;
  }) => void;
}

export const useBokforStore = create<BokforStore>((set, get) => ({
  // Initial state
  currentStep: 1,
  favoritFörvalen: [],
  levfaktMode: false,
  utlaggMode: false,

  // Formulärfält
  kontonummer: "",
  kontobeskrivning: null,
  belopp: null,
  kommentar: null,
  fil: null,
  pdfUrl: null,
  transaktionsdatum: null,
  valtFörval: null,
  extrafält: {},

  // Leverantörsfaktura-fält
  leverantör: null,
  fakturanummer: null,
  fakturadatum: null,
  förfallodatum: null,
  betaldatum: null,
  bokförSomFaktura: false,
  kundfakturadatum: null,

  // Navigation actions
  setCurrentStep: (currentStep: number) => set({ currentStep }),
  setFavoritFörvalen: (favoritFörvalen: Förval[]) => set({ favoritFörvalen }),
  setLevfaktMode: (levfaktMode: boolean) => set({ levfaktMode }),
  setUtlaggMode: (utlaggMode: boolean) => set({ utlaggMode }),

  handleSetCurrentStep: (
    step: number,
    router?: any,
    setIsLevfaktMode?: (value: boolean) => void,
    setLeverantör?: (value: any) => void
  ) => {
    if (step === 1) {
      // Återställ levfakt-läge så att standard Steg2 med checkbox kan visas igen
      setIsLevfaktMode?.(false);
      setLeverantör?.(null);
      // Ta bort ev. query params levfakt & leverantorId
      router?.replace("/bokfor");
    }
    set({ currentStep: step });
  },

  // Actions för alla formulärfält
  setKontonummer: (kontonummer: string) => set({ kontonummer }),
  setKontobeskrivning: (kontobeskrivning: string | null) => set({ kontobeskrivning }),
  setBelopp: (belopp: number | null) => set({ belopp }),
  setKommentar: (kommentar: string | null) => set({ kommentar }),
  setFil: (fil: File | null) => set({ fil }),
  setPdfUrl: (pdfUrl: string | null) => set({ pdfUrl }),
  setTransaktionsdatum: (transaktionsdatum: string | null) => set({ transaktionsdatum }),
  setValtFörval: (valtFörval: Förval | null) => set({ valtFörval }),
  setExtrafält: (extrafält: Record<string, { label: string; debet: number; kredit: number }>) =>
    set({ extrafält }),

  // Leverantörsfaktura actions
  setLeverantör: (leverantör: any | null) => set({ leverantör }),
  setFakturanummer: (fakturanummer: string | null) => set({ fakturanummer }),
  setFakturadatum: (fakturadatum: string | null) => set({ fakturadatum }),
  setFörfallodatum: (förfallodatum: string | null) => set({ förfallodatum }),
  setBetaldatum: (betaldatum: string | null) => set({ betaldatum }),
  setBokförSomFaktura: (bokförSomFaktura: boolean) => set({ bokförSomFaktura }),
  setKundfakturadatum: (kundfakturadatum: string | null) => set({ kundfakturadatum }),

  // Reset function
  resetAllFields: () =>
    set({
      kontonummer: "",
      kontobeskrivning: null,
      belopp: null,
      kommentar: null,
      fil: null,
      pdfUrl: null,
      transaktionsdatum: null,
      valtFörval: null,
      extrafält: {},
      leverantör: null,
      fakturanummer: null,
      fakturadatum: null,
      förfallodatum: null,
      betaldatum: null,
      bokförSomFaktura: false,
      kundfakturadatum: null,
    }),

  // Initialisera store med server data (idempotent)
  initStore: (data) => {
    const current = get();
    // Bara uppdatera om det faktiskt har ändrats
    if (
      current.currentStep !== data.currentStep ||
      current.levfaktMode !== data.levfaktMode ||
      current.utlaggMode !== data.utlaggMode ||
      current.favoritFörvalen.length !== data.favoritFörvalen.length
    ) {
      set({
        favoritFörvalen: data.favoritFörvalen,
        levfaktMode: data.levfaktMode,
        utlaggMode: data.utlaggMode,
        currentStep: data.currentStep,
      });
    }
  },

  // Business logic functions
  exitLevfaktMode: (router) => {
    set({ levfaktMode: false, leverantör: null });
    if (router) {
      router.replace("/bokfor?step=2");
    }
  },
}));
