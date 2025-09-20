"use client";

import React, { createContext, useContext, useReducer, ReactNode } from "react";
import type {
  AnställdData,
  AnställdListItem,
  NyAnställdFormular,
  ToastTillstand,
  UtläggData,
  UtlaggBokföringsRad,
  EditData,
  PersonalState,
  PersonalAction,
  PersonalContextType,
} from "../_types/types";

// ===========================
// INITIAL STATE
// ===========================

const initialNyAnställdFormulär: NyAnställdFormular = {
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
  slutdatum: new Date(),
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
};

const initialEditData: EditData = {
  anställningstyp: "",
  startdatum: new Date(),
  slutdatum: new Date(),
  månadslön: "",
  betalningssätt: "",
  kompensation: "",
  ersättningPer: "",
  arbetsbelastning: "",
  arbetsveckaTimmar: "",
  deltidProcent: "",
  skattetabell: "",
  skattekolumn: "",
  jobbtitel: "",
  semesterdagarPerÅr: "",
  tjänsteställeAdress: "",
  tjänsteställeOrt: "",
};

const initialState: PersonalState = {
  // ANSTÄLLDA STATE
  anställda: [],
  valdAnställd: null,
  anställdaLoading: false,
  anställdLoading: false,
  anställdLoadingId: null,
  anställdaError: null,

  // NY ANSTÄLLD FORMULÄR STATE
  nyAnställdFormulär: initialNyAnställdFormulär,
  nyAnställdLoading: false,
  visaNyAnställdFormulär: false,

  // TOAST STATE
  toast: { isVisible: false, message: "", type: "success" },

  // UTLÄGG STATE
  utlägg: [],
  utläggLoading: false,
  utläggBokföringModal: {
    isOpen: false,
    utlägg: null,
    previewRows: [],
    loading: false,
  },
  utbetalningsdatum: null,

  // LÖNEKÖRNING / LÖNESPEC STATE
  laddaLönespecar: false,
  löneperiod: null,
  lönespecar: {},
  sparar: {},
  taBort: {},
  förhandsgranskaId: null,

  // KONTRAKT STATE
  kontraktIsEditing: false,
  kontraktEditData: initialEditData,
  kontraktHasChanges: false,
  kontraktError: null,

  // SEMESTER STATE
  semesterTransaktioner: [],
  semesterLoading: false,
  semesterBokförModal: {
    isOpen: false,
    loading: false,
  },
  semesterData: {
    betalda_dagar: 0,
    sparade_dagar: 0,
    skuld: 0,
    komp_dagar: 0,
  },

  // BOKFÖRING STATE
  bokföringRegler: [],
  bokföringTransaktioner: [],
  bokföringLoading: false,
};

// ===========================
// REDUCER
// ===========================

function personalReducer(state: PersonalState, action: PersonalAction): PersonalState {
  switch (action.type) {
    // ANSTÄLLDA ACTIONS
    case "SET_ANSTÄLLDA":
      return { ...state, anställda: action.payload };
    case "SET_VALD_ANSTÄLLD":
      return { ...state, valdAnställd: action.payload };
    case "SET_ANSTÄLLDA_LOADING":
      return { ...state, anställdaLoading: action.payload };
    case "SET_ANSTÄLLD_LOADING":
      return { ...state, anställdLoading: action.payload };
    case "SET_ANSTÄLLD_LOADING_ID":
      return { ...state, anställdLoadingId: action.payload };
    case "SET_ANSTÄLLDA_ERROR":
      return { ...state, anställdaError: action.payload };

    // NY ANSTÄLLD ACTIONS
    case "SET_NY_ANSTÄLLD_FORMULÄR":
      return {
        ...state,
        nyAnställdFormulär: { ...state.nyAnställdFormulär, ...action.payload },
      };
    case "RESET_NY_ANSTÄLLD_FORMULÄR":
      return { ...state, nyAnställdFormulär: initialNyAnställdFormulär };
    case "SET_NY_ANSTÄLLD_LOADING":
      return { ...state, nyAnställdLoading: action.payload };
    case "SET_VISA_NY_ANSTÄLLD_FORMULÄR":
      return { ...state, visaNyAnställdFormulär: action.payload };

    // TOAST ACTIONS
    case "SET_TOAST":
      return { ...state, toast: action.payload };
    case "CLEAR_TOAST":
      return { ...state, toast: { isVisible: false, message: "", type: "success" } };

    // UTLÄGG ACTIONS
    case "SET_UTLÄGG":
      return { ...state, utlägg: action.payload };
    case "SET_UTLÄGG_LOADING":
      return { ...state, utläggLoading: action.payload };
    case "OPEN_UTLÄGG_BOKFÖRING_MODAL":
      return {
        ...state,
        utläggBokföringModal: {
          isOpen: true,
          utlägg: action.payload.utlägg,
          previewRows: action.payload.previewRows,
          loading: false,
        },
      };
    case "CLOSE_UTLÄGG_BOKFÖRING_MODAL":
      return {
        ...state,
        utläggBokföringModal: {
          isOpen: false,
          utlägg: null,
          previewRows: [],
          loading: false,
        },
      };
    case "SET_UTBETALNINGSDATUM":
      return { ...state, utbetalningsdatum: action.payload };

    // LÖNEKÖRNING ACTIONS
    case "SET_LADDA_LÖNESPECAR":
      return { ...state, laddaLönespecar: action.payload };
    case "SET_LÖNEPERIOD":
      return { ...state, löneperiod: action.payload };
    case "SET_LÖNESPECAR":
      return { ...state, lönespecar: action.payload };
    case "SET_SPARAR":
      return {
        ...state,
        sparar: { ...state.sparar, [action.payload.id]: action.payload.sparar },
      };
    case "SET_TA_BORT":
      return {
        ...state,
        taBort: { ...state.taBort, [action.payload.id]: action.payload.taBort },
      };
    case "SET_FÖRHANDSGRANSKAS_ID":
      return { ...state, förhandsgranskaId: action.payload };

    // KONTRAKT ACTIONS
    case "SET_KONTRAKT_IS_EDITING":
      return { ...state, kontraktIsEditing: action.payload };
    case "SET_KONTRAKT_EDIT_DATA":
      return { ...state, kontraktEditData: action.payload };
    case "UPDATE_KONTRAKT_EDIT_DATA":
      return {
        ...state,
        kontraktEditData: {
          ...state.kontraktEditData,
          [action.payload.field]: action.payload.value,
        },
      };
    case "SET_KONTRAKT_HAS_CHANGES":
      return { ...state, kontraktHasChanges: action.payload };
    case "SET_KONTRAKT_ERROR":
      return { ...state, kontraktError: action.payload };
    case "RESET_KONTRAKT_EDIT_DATA":
      return { ...state, kontraktEditData: initialEditData };

    // SEMESTER ACTIONS
    case "SET_SEMESTER_TRANSAKTIONER":
      return { ...state, semesterTransaktioner: action.payload };
    case "SET_SEMESTER_LOADING":
      return { ...state, semesterLoading: action.payload };
    case "OPEN_SEMESTER_BOKFÖR_MODAL":
      return {
        ...state,
        semesterBokförModal: { ...state.semesterBokförModal, isOpen: true },
      };
    case "CLOSE_SEMESTER_BOKFÖR_MODAL":
      return {
        ...state,
        semesterBokförModal: { ...state.semesterBokförModal, isOpen: false },
      };
    case "SET_SEMESTER_DATA":
      return { ...state, semesterData: action.payload };

    // BOKFÖRING ACTIONS
    case "SET_BOKFÖRING_REGLER":
      return { ...state, bokföringRegler: action.payload };
    case "SET_BOKFÖRING_TRANSAKTIONER":
      return { ...state, bokföringTransaktioner: action.payload };
    case "SET_BOKFÖRING_LOADING":
      return { ...state, bokföringLoading: action.payload };

    default:
      return state;
  }
}

// ===========================
// CONTEXT
// ===========================

const PersonalContext = createContext<PersonalContextType | undefined>(undefined);

// ===========================
// PROVIDER
// ===========================

export function PersonalProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(personalReducer, initialState);

  const contextValue: PersonalContextType = {
    state,

    // ANSTÄLLDA ACTIONS
    setAnställda: (anställda) => dispatch({ type: "SET_ANSTÄLLDA", payload: anställda }),
    setValdAnställd: (anställd) => dispatch({ type: "SET_VALD_ANSTÄLLD", payload: anställd }),
    setAnställdaLoading: (loading) => dispatch({ type: "SET_ANSTÄLLDA_LOADING", payload: loading }),
    setAnställdLoading: (loading) => dispatch({ type: "SET_ANSTÄLLD_LOADING", payload: loading }),
    setAnställdLoadingId: (id) => dispatch({ type: "SET_ANSTÄLLD_LOADING_ID", payload: id }),
    setAnställdaError: (error) => dispatch({ type: "SET_ANSTÄLLDA_ERROR", payload: error }),

    // NY ANSTÄLLD ACTIONS
    setNyAnställdFormulär: (formulär) =>
      dispatch({ type: "SET_NY_ANSTÄLLD_FORMULÄR", payload: formulär }),
    resetNyAnställdFormulär: () => dispatch({ type: "RESET_NY_ANSTÄLLD_FORMULÄR" }),
    setNyAnställdLoading: (loading) =>
      dispatch({ type: "SET_NY_ANSTÄLLD_LOADING", payload: loading }),
    setVisaNyAnställdFormulär: (visa) =>
      dispatch({ type: "SET_VISA_NY_ANSTÄLLD_FORMULÄR", payload: visa }),

    // TOAST ACTIONS
    setToast: (toast) => dispatch({ type: "SET_TOAST", payload: toast }),
    clearToast: () => dispatch({ type: "CLEAR_TOAST" }),

    // UTLÄGG ACTIONS
    setUtlägg: (utlägg) => dispatch({ type: "SET_UTLÄGG", payload: utlägg }),
    setUtläggLoading: (loading) => dispatch({ type: "SET_UTLÄGG_LOADING", payload: loading }),
    openUtläggBokföringModal: (utlägg, previewRows) =>
      dispatch({ type: "OPEN_UTLÄGG_BOKFÖRING_MODAL", payload: { utlägg, previewRows } }),
    closeUtläggBokföringModal: () => dispatch({ type: "CLOSE_UTLÄGG_BOKFÖRING_MODAL" }),
    setUtbetalningsdatum: (datum) => dispatch({ type: "SET_UTBETALNINGSDATUM", payload: datum }),

    // LÖNEKÖRNING ACTIONS
    setLaddaLönespecar: (ladda) => dispatch({ type: "SET_LADDA_LÖNESPECAR", payload: ladda }),
    setLöneperiod: (period) => dispatch({ type: "SET_LÖNEPERIOD", payload: period }),
    setLönespecar: (specs) => dispatch({ type: "SET_LÖNESPECAR", payload: specs }),
    setSparar: (id, sparar) => dispatch({ type: "SET_SPARAR", payload: { id, sparar } }),
    setTaBort: (id, taBort) => dispatch({ type: "SET_TA_BORT", payload: { id, taBort } }),
    setFörhandsgranskaId: (id) => dispatch({ type: "SET_FÖRHANDSGRANSKAS_ID", payload: id }),

    // KONTRAKT ACTIONS
    setKontraktIsEditing: (editing) =>
      dispatch({ type: "SET_KONTRAKT_IS_EDITING", payload: editing }),
    setKontraktEditData: (data) => dispatch({ type: "SET_KONTRAKT_EDIT_DATA", payload: data }),
    updateKontraktEditData: (field, value) =>
      dispatch({ type: "UPDATE_KONTRAKT_EDIT_DATA", payload: { field, value } }),
    setKontraktHasChanges: (hasChanges) =>
      dispatch({ type: "SET_KONTRAKT_HAS_CHANGES", payload: hasChanges }),
    setKontraktError: (error) => dispatch({ type: "SET_KONTRAKT_ERROR", payload: error }),
    resetKontraktEditData: () => dispatch({ type: "RESET_KONTRAKT_EDIT_DATA" }),

    // SEMESTER ACTIONS
    setSemesterTransaktioner: (transaktioner) =>
      dispatch({ type: "SET_SEMESTER_TRANSAKTIONER", payload: transaktioner }),
    setSemesterLoading: (loading) => dispatch({ type: "SET_SEMESTER_LOADING", payload: loading }),
    openSemesterBokförModal: () => dispatch({ type: "OPEN_SEMESTER_BOKFÖR_MODAL" }),
    closeSemesterBokförModal: () => dispatch({ type: "CLOSE_SEMESTER_BOKFÖR_MODAL" }),
    setSemesterData: (data) => dispatch({ type: "SET_SEMESTER_DATA", payload: data }),

    // BOKFÖRING ACTIONS
    setBokföringRegler: (regler) => dispatch({ type: "SET_BOKFÖRING_REGLER", payload: regler }),
    setBokföringTransaktioner: (transaktioner) =>
      dispatch({ type: "SET_BOKFÖRING_TRANSAKTIONER", payload: transaktioner }),
    setBokföringLoading: (loading) => dispatch({ type: "SET_BOKFÖRING_LOADING", payload: loading }),
  };

  return <PersonalContext.Provider value={contextValue}>{children}</PersonalContext.Provider>;
}

// ===========================
// HOOK
// ===========================

export function usePersonalContext() {
  const context = useContext(PersonalContext);
  if (context === undefined) {
    throw new Error("usePersonalContext must be used within a PersonalProvider");
  }
  return context;
}
