"use client";

import { createContext, useCallback, useContext, useMemo, useReducer } from "react";
import type {
  FavoritArtikel,
  NyArtikel,
  FakturaArtikelState,
  FakturaArtikelAction,
  FakturaArtikelContextValue,
  FakturaArtikelProviderProps,
} from "../types/types";

const defaultNyArtikel: NyArtikel = {
  beskrivning: "",
  antal: "",
  prisPerEnhet: "",
  moms: "25",
  valuta: "SEK",
  typ: "tjänst",
};

const defaultState: FakturaArtikelState = {
  nyArtikel: defaultNyArtikel,
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
  showDeleteFavoritModal: false,
  deleteFavoritId: null,
};

function reducer(state: FakturaArtikelState, action: FakturaArtikelAction): FakturaArtikelState {
  switch (action.type) {
    case "SET_STATE":
      return { ...state, ...action.payload };
    case "RESET_STATE":
      return defaultState;
    case "SET_NY_ARTIKEL":
      return { ...state, nyArtikel: { ...state.nyArtikel, ...action.payload } };
    case "RESET_NY_ARTIKEL":
      return { ...state, nyArtikel: defaultNyArtikel };
    case "SET_FAVORIT_ARTIKLAR":
      return { ...state, favoritArtiklar: action.payload };
    default:
      return state;
  }
}

const FakturaArtikelContext = createContext<FakturaArtikelContextValue | undefined>(undefined);

export function FakturaArtikelProvider({ children }: FakturaArtikelProviderProps) {
  const [state, dispatch] = useReducer(reducer, defaultState);

  const setState = useCallback((updates: Partial<FakturaArtikelState>) => {
    dispatch({ type: "SET_STATE", payload: updates });
  }, []);

  const setNyArtikel = useCallback((updates: Partial<NyArtikel>) => {
    dispatch({ type: "SET_NY_ARTIKEL", payload: updates });
  }, []);

  const resetNyArtikel = useCallback(() => {
    dispatch({ type: "RESET_NY_ARTIKEL" });
  }, []);

  const setFavoritArtiklar = useCallback((artiklar: FavoritArtikel[]) => {
    dispatch({ type: "SET_FAVORIT_ARTIKLAR", payload: artiklar });
  }, []);

  const resetState = useCallback(() => {
    dispatch({ type: "RESET_STATE" });
  }, []);

  const value = useMemo(
    () => ({
      state,
      setState,
      setNyArtikel,
      resetNyArtikel,
      setFavoritArtiklar,
      resetState,
    }),
    [state, setState, setNyArtikel, resetNyArtikel, setFavoritArtiklar, resetState]
  );

  return <FakturaArtikelContext.Provider value={value}>{children}</FakturaArtikelContext.Provider>;
}

export function useFakturaArtikelContext() {
  const context = useContext(FakturaArtikelContext);
  if (!context) {
    throw new Error("useFakturaArtikelContext must be used within a FakturaArtikelProvider");
  }
  return context;
}
