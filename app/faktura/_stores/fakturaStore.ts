"use client";

import { create } from "zustand";
import type { FakturaStoreState, FakturaFormData, NyArtikel, ServerData } from "../_types/types";

// Default values
const defaultFormData: FakturaFormData = {
  id: "",
  fakturanummer: "",
  fakturadatum: "",
  forfallodatum: "",
  betalningsmetod: "",
  betalningsvillkor: "",
  drojsmalsranta: "",
  kundId: "",
  nummer: "",
  personnummer: "",
  fastighetsbeteckning: "",
  rotBoendeTyp: "fastighet",
  brfOrganisationsnummer: "",
  brfLagenhetsnummer: "",

  // Kunduppgifter
  kundnamn: "",
  kundnummer: "",
  kundorganisationsnummer: "",
  kundmomsnummer: "",
  kundadress: "",
  kundpostnummer: "",
  kundstad: "",
  kundemail: "",

  // Avsändare
  företagsnamn: "",
  adress: "",
  postnummer: "",
  stad: "",
  organisationsnummer: "",
  momsregistreringsnummer: "",
  telefonnummer: "",
  bankinfo: "",
  epost: "",
  webbplats: "",
  logo: "",
  logoWidth: 200,

  rotRutAktiverat: false,
  rotRutTyp: "ROT",
  rotRutKategori: "",
  avdragProcent: 0,
  avdragBelopp: 0,
  arbetskostnadExMoms: 0,
  materialkostnadExMoms: 0,
  rotRutBeskrivning: "",
  rotRutStartdatum: "",
  rotRutSlutdatum: "",

  artiklar: [],
};

const defaultNyArtikel: NyArtikel = {
  beskrivning: "",
  antal: "",
  prisPerEnhet: "",
  moms: "25",
  valuta: "SEK",
  typ: "tjänst",
};

const defaultProdukterTjansterState = {
  favoritArtiklar: [],
  showFavoritArtiklar: false,
  blinkIndex: null,
  visaRotRutForm: false,
  visaArtikelForm: false,
  visaArtikelModal: false,
  redigerarIndex: null,
  favoritArtikelVald: false,
  ursprungligFavoritId: null,
  artikelSparadSomFavorit: false,
  valtArtikel: null,
};

export const useFakturaStore = create<FakturaStoreState>((set, get) => ({
  // Initial state
  formData: defaultFormData,
  kundStatus: "none",
  nyArtikel: defaultNyArtikel,
  produkterTjansterState: defaultProdukterTjansterState,

  // Actions
  setFormData: (data) =>
    set((state) => ({
      formData: { ...state.formData, ...data },
    })),

  resetFormData: () =>
    set({
      formData: defaultFormData,
      kundStatus: "none",
    }),

  setKundStatus: (status) => set({ kundStatus: status }),

  resetKund: () =>
    set((state) => ({
      formData: {
        ...state.formData,
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
      kundStatus: "none",
    })),

  setNyArtikel: (artikel) =>
    set((state) => ({
      nyArtikel: { ...state.nyArtikel, ...artikel },
    })),

  resetNyArtikel: () => set({ nyArtikel: defaultNyArtikel }),

  // ProdukterTjanster actions
  setProdukterTjansterState: (state) =>
    set((currentState) => ({
      produkterTjansterState: { ...currentState.produkterTjansterState, ...state },
    })),

  resetProdukterTjanster: () => set({ produkterTjansterState: defaultProdukterTjansterState }),

  // Init function för server data
  initStore: (data: ServerData) => {
    if (data.foretagsprofil) {
      const profil = data.foretagsprofil;
      set((state) => ({
        formData: {
          ...state.formData,
          företagsnamn: profil.företagsnamn ?? "",
          adress: profil.adress ?? "",
          postnummer: profil.postnummer ?? "",
          stad: profil.stad ?? "",
          organisationsnummer: profil.organisationsnummer ?? "",
          momsregistreringsnummer: profil.momsregistreringsnummer ?? "",
          telefonnummer: profil.telefonnummer ?? "",
          epost: profil.epost ?? "",
          bankinfo: profil.bankinfo ?? "",
          webbplats: profil.webbplats ?? "",
        },
      }));
    }
  },
}));
