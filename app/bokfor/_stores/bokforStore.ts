import { create } from "zustand";
import { Förval, UtlaggAnställd, BokforStore } from "../_types/types";

export const useBokforStore = create<BokforStore>((set, get) => ({
  // Initial state
  currentStep: 1,
  favoritFörval: [],
  allaFörval: [],
  anställda: [],
  bokföringsmetod: "Kontantmetoden",
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
  setFavoritFörvalen: (förvalen: Förval[]) => set({ favoritFörval: förvalen }),
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
      current.bokföringsmetod !== data.bokföringsmetod ||
      current.favoritFörval.length !== data.favoritFörval.length ||
      current.allaFörval.length !== data.allaFörval.length ||
      current.anställda.length !== data.anställda.length
    ) {
      set({
        favoritFörval: data.favoritFörval,
        allaFörval: data.allaFörval,
        anställda: data.anställda,
        bokföringsmetod: data.bokföringsmetod,
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
