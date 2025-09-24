"use client";

import React, { createContext, useContext, useReducer, ReactNode } from "react";
import type {
  FakturaFormData,
  NyArtikel,
  KundStatus,
  ServerData,
  FavoritArtikel,
  FakturaState,
  FakturaAction,
  FakturaContextType,
  FakturaProviderProps,
  ViewType,
  NavigationState,
} from "../types/types";

// Default values - samma som i Zustand store
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
  favoritArtiklar: [] as FavoritArtikel[],
  showFavoritArtiklar: false,
  blinkIndex: null as number | null,
  visaRotRutForm: false,
  visaArtikelForm: false,
  visaArtikelModal: false,
  redigerarIndex: null as number | null,
  favoritArtikelVald: false,
  ursprungligFavoritId: null as number | null,
  artikelSparadSomFavorit: false,
  valtArtikel: null as FavoritArtikel | null,
};

const defaultUserSettings = {
  bokföringsmetod: "kontantmetoden" as "kontantmetoden" | "fakturametoden",
};

const defaultNavigationState = {
  currentView: "menu" as ViewType,
};

// Initial state
const initialState: FakturaState = {
  formData: defaultFormData,
  kundStatus: "none",
  navigationState: defaultNavigationState,
  nyArtikel: defaultNyArtikel,
  produkterTjansterState: defaultProdukterTjansterState,
  userSettings: defaultUserSettings,
};

// Reducer function
function fakturaReducer(state: FakturaState, action: FakturaAction): FakturaState {
  switch (action.type) {
    case "SET_FORM_DATA":
      return {
        ...state,
        formData: { ...state.formData, ...action.payload },
      };

    case "RESET_FORM_DATA":
      return {
        ...state,
        formData: defaultFormData,
        kundStatus: "none",
      };

    case "SET_KUND_STATUS":
      return {
        ...state,
        kundStatus: action.payload,
      };

    case "RESET_KUND":
      return {
        ...state,
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
      };

    case "SET_NAVIGATION":
      return {
        ...state,
        navigationState: { ...state.navigationState, ...action.payload },
      };

    case "NAVIGATE_TO_VIEW":
      return {
        ...state,
        navigationState: { currentView: action.payload },
      };

    case "NAVIGATE_TO_EDIT":
      return {
        ...state,
        navigationState: {
          currentView: action.payload.view,
          editFakturaId: action.payload.fakturaId,
        },
      };

    case "NAVIGATE_BACK":
      return {
        ...state,
        navigationState: { currentView: "menu" },
      };

    case "SET_NY_ARTIKEL":
      return {
        ...state,
        nyArtikel: { ...state.nyArtikel, ...action.payload },
      };

    case "RESET_NY_ARTIKEL":
      return {
        ...state,
        nyArtikel: defaultNyArtikel,
      };

    case "SET_PRODUKTER_TJANSTER_STATE":
      return {
        ...state,
        produkterTjansterState: { ...state.produkterTjansterState, ...action.payload },
      };

    case "RESET_PRODUKTER_TJANSTER":
      return {
        ...state,
        produkterTjansterState: defaultProdukterTjansterState,
      };

    case "SET_BOKFÖRINGSMETOD":
      return {
        ...state,
        userSettings: { ...state.userSettings, bokföringsmetod: action.payload },
      };

    case "INIT_STORE":
      if (action.payload.foretagsprofil) {
        const profil = action.payload.foretagsprofil;
        return {
          ...state,
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
        };
      }
      return state;

    default:
      return state;
  }
}

// Create contexts
const FakturaContext = createContext<FakturaContextType | undefined>(undefined);

// Provider component
export function FakturaProvider({ children, initialData }: FakturaProviderProps) {
  const [state, dispatch] = useReducer(fakturaReducer, initialState);

  // Initialize store with server data on mount
  React.useEffect(() => {
    if (initialData) {
      dispatch({ type: "INIT_STORE", payload: initialData });
    }
  }, [initialData]);

  // Helper actions - samma API som Zustand store för enklare migration
  const contextValue: FakturaContextType = {
    state,
    dispatch,
    setFormData: (data) => dispatch({ type: "SET_FORM_DATA", payload: data }),
    resetFormData: () => dispatch({ type: "RESET_FORM_DATA" }),
    setKundStatus: (status) => dispatch({ type: "SET_KUND_STATUS", payload: status }),
    resetKund: () => dispatch({ type: "RESET_KUND" }),
    setNavigation: (navigation) => dispatch({ type: "SET_NAVIGATION", payload: navigation }),
    navigateToView: (view) => dispatch({ type: "NAVIGATE_TO_VIEW", payload: view }),
    navigateToEdit: (view, fakturaId) =>
      dispatch({ type: "NAVIGATE_TO_EDIT", payload: { view, fakturaId } }),
    navigateBack: () => dispatch({ type: "NAVIGATE_BACK" }),
    setNyArtikel: (artikel) => dispatch({ type: "SET_NY_ARTIKEL", payload: artikel }),
    resetNyArtikel: () => dispatch({ type: "RESET_NY_ARTIKEL" }),
    setProdukterTjansterState: (state) =>
      dispatch({ type: "SET_PRODUKTER_TJANSTER_STATE", payload: state }),
    resetProdukterTjanster: () => dispatch({ type: "RESET_PRODUKTER_TJANSTER" }),
    setBokföringsmetod: (metod) => dispatch({ type: "SET_BOKFÖRINGSMETOD", payload: metod }),
    initStore: (data) => dispatch({ type: "INIT_STORE", payload: data }),
  };

  return <FakturaContext.Provider value={contextValue}>{children}</FakturaContext.Provider>;
}

// Custom hook to use the context
export function useFakturaContext() {
  const context = useContext(FakturaContext);
  if (context === undefined) {
    throw new Error("useFakturaContext must be used within a FakturaProvider");
  }
  return context;
}

// Custom hooks that mirror the Zustand store API for easier migration
export function useFakturaClient() {
  const context = useFakturaContext();

  return {
    formData: context.state.formData,
    kundStatus: context.state.kundStatus,
    nyArtikel: context.state.nyArtikel,
    produkterTjansterState: context.state.produkterTjansterState,
    userSettings: context.state.userSettings,
    setFormData: context.setFormData,
    resetFormData: context.resetFormData,
    setKundStatus: context.setKundStatus,
    resetKund: context.resetKund,
    setNyArtikel: context.setNyArtikel,
    resetNyArtikel: context.resetNyArtikel,
    setProdukterTjansterState: context.setProdukterTjansterState,
    resetProdukterTjanster: context.resetProdukterTjanster,
    setBokföringsmetod: context.setBokföringsmetod,
    initStore: context.initStore,
  };
}
