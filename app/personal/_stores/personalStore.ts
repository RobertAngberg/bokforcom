"use client";

import { create } from "zustand";
import { sanitizeFormInput } from "../../_utils/validationUtils";
import type {
  PersonalStoreState,
  AnställdData,
  AnställdListItem,
  NyAnställdFormular,
  ToastTillstand,
  UtläggData,
  UtlaggBokföringsRad,
} from "../_types/types";

export const usePersonalStore = create<PersonalStoreState>((set, get) => ({
  // ===================
  // ANSTÄLLDA STATE
  // ===================
  anställda: [],
  valdAnställd: null,
  anställdaLoading: false,
  anställdLoading: false,
  anställdLoadingId: null,
  anställdaError: null,

  // ===================
  // NY ANSTÄLLD FORMULÄR STATE
  // ===================
  nyAnställdFormulär: {
    // Personal information
    förnamn: "",
    efternamn: "",
    personnummer: "",
    jobbtitel: "",
    clearingnummer: "",
    bankkonto: "",
    mail: "",
    adress: "",
    postnummer: "",
    ort: "",

    // Dates
    startdatum: new Date(),
    slutdatum: (() => {
      const datum = new Date();
      datum.setFullYear(datum.getFullYear() + 1);
      return datum;
    })(),

    // Employment details
    anställningstyp: "",
    löneperiod: "",
    ersättningPer: "",
    kompensation: "",
    arbetsvecka: "",
    arbetsbelastning: "",
    deltidProcent: "",

    // Workplace
    tjänsteställeAdress: "",
    tjänsteställeOrt: "",

    // Tax information
    skattetabell: "",
    skattekolumn: "",
    växaStöd: false,
  },
  nyAnställdLoading: false,
  visaNyAnställdFormulär: false,

  // ===================
  // TOAST STATE
  // ===================
  toast: {
    message: "",
    type: "success",
    isVisible: false,
  },

  // ===================
  // UTLÄGG STATE
  // ===================
  utlägg: [],
  utläggLoading: false,
  utläggBokföringModal: {
    isOpen: false,
    utlägg: null,
    previewRows: [],
    loading: false,
  },

  // ===================
  // ANSTÄLLDA ACTIONS
  // ===================
  setAnställda: (anställda) => set({ anställda }),

  setValdAnställd: (anställd) => set({ valdAnställd: anställd }),

  setAnställdaLoading: (loading) => set({ anställdaLoading: loading }),

  setAnställdLoading: (loading) => set({ anställdLoading: loading }),

  setAnställdLoadingId: (id) => set({ anställdLoadingId: id }),

  setAnställdaError: (error) => set({ anställdaError: error }),

  // Lägg till anställd i listan
  addAnställd: (anställd) =>
    set((state) => ({
      anställda: [...state.anställda, anställd],
    })),

  // Ta bort anställd från listan
  removeAnställd: (id) =>
    set((state) => ({
      anställda: state.anställda.filter((a) => a.id !== id),
    })),

  // Uppdatera anställd i listan
  updateAnställd: (id, updatedData) =>
    set((state) => ({
      anställda: state.anställda.map((a) => (a.id === id ? { ...a, ...updatedData } : a)),
    })),

  // ===================
  // NY ANSTÄLLD FORMULÄR ACTIONS
  // ===================
  setNyAnställdFormulär: (formulär) => set({ nyAnställdFormulär: formulär }),

  updateNyAnställdFormulär: (updates) =>
    set((state) => ({
      nyAnställdFormulär: { ...state.nyAnställdFormulär, ...updates },
    })),

  handleSanitizedChange: (e: any) => {
    const { name, value } = e.target;
    const { hideToast, toast } = get();

    const sanitizedValue = ["förnamn", "efternamn", "jobbtitel", "mail", "adress", "ort"].includes(
      name
    )
      ? sanitizeFormInput(value)
      : value;

    set((state) => ({
      nyAnställdFormulär: { ...state.nyAnställdFormulär, [name]: sanitizedValue },
    }));

    if (toast.isVisible) {
      hideToast();
    }
  },

  resetNyAnställdFormulär: () =>
    set({
      nyAnställdFormulär: {
        förnamn: "",
        efternamn: "",
        personnummer: "",
        jobbtitel: "",
        clearingnummer: "",
        bankkonto: "",
        mail: "",
        adress: "",
        postnummer: "",
        ort: "",
        startdatum: new Date(),
        slutdatum: (() => {
          const datum = new Date();
          datum.setFullYear(datum.getFullYear() + 1);
          return datum;
        })(),
        anställningstyp: "",
        löneperiod: "",
        ersättningPer: "",
        kompensation: "",
        arbetsvecka: "",
        arbetsbelastning: "",
        deltidProcent: "",
        tjänsteställeAdress: "",
        tjänsteställeOrt: "",
        skattetabell: "",
        skattekolumn: "",
        växaStöd: false,
      },
    }),

  setNyAnställdLoading: (loading) => set({ nyAnställdLoading: loading }),

  setVisaNyAnställdFormulär: (visa) => set({ visaNyAnställdFormulär: visa }),

  // ===================
  // TOAST ACTIONS
  // ===================
  setToast: (toast) => set({ toast }),

  showToast: (message, type = "success") =>
    set({
      toast: { message, type, isVisible: true },
    }),

  hideToast: () =>
    set((state) => ({
      toast: { ...state.toast, isVisible: false },
    })),

  // ===================
  // UTLÄGG ACTIONS
  // ===================
  setUtlägg: (utlägg) => set({ utlägg }),

  setUtläggLoading: (loading) => set({ utläggLoading: loading }),

  // Utlägg bokförings modal
  openUtläggBokföringModal: (utlägg, previewRows) =>
    set({
      utläggBokföringModal: {
        isOpen: true,
        utlägg,
        previewRows,
        loading: false,
      },
    }),

  closeUtläggBokföringModal: () =>
    set({
      utläggBokföringModal: {
        isOpen: false,
        utlägg: null,
        previewRows: [],
        loading: false,
      },
    }),

  setUtläggBokföringLoading: (loading) =>
    set((state) => ({
      utläggBokföringModal: {
        ...state.utläggBokföringModal,
        loading,
      },
    })),

  // ===================
  // INIT FUNCTION
  // ===================
  initStore: (data) =>
    set({
      anställda: data.anställda || [],
      valdAnställd: data.valdAnställd || null,
      utlägg: data.utlägg || [],
    }),
}));
