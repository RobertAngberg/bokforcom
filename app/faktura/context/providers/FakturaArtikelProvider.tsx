// Den här komponenten är “motorn” som håller ordning på artikel-state och delar ut det via context.
// Lägg dina barnkomponenter här inne så får de samma artikeldata och uppdateringsfunktioner.

"use client";

import { useCallback, useMemo, useReducer } from "react";
import type {
  FavoritArtikel,
  NyArtikel,
  FakturaArtikelState,
  FakturaArtikelAction,
  FakturaArtikelProviderProps,
} from "../../types/types";
import { FakturaArtikelContext } from "../hooks/FakturaArtikelContext";
import {
  createDefaultFakturaArtikelState,
  createDefaultNyArtikel,
  withFavoritArtiklar,
} from "../defaults/FakturaArtikelDefaults";

// Reducern översätter små action-objekt till hur artikelstatet faktiskt ska förändras.
function reducer(state: FakturaArtikelState, action: FakturaArtikelAction): FakturaArtikelState {
  switch (action.type) {
    case "SET_STATE":
      return { ...state, ...action.payload };
    case "RESET_STATE":
      return createDefaultFakturaArtikelState();
    case "SET_NY_ARTIKEL":
      return { ...state, nyArtikel: { ...state.nyArtikel, ...action.payload } };
    case "RESET_NY_ARTIKEL":
      return { ...state, nyArtikel: createDefaultNyArtikel() };
    case "SET_FAVORIT_ARTIKLAR":
      return { ...state, favoritArtiklar: action.payload };
    default:
      return state;
  }
}

// Själva providern packar in barnen och ger dem tillgång till artikelstate och uppdaterare.
export function FakturaArtikelProvider({
  children,
  initialFavoritArtiklar,
}: FakturaArtikelProviderProps) {
  const [state, dispatch] = useReducer(reducer, initialFavoritArtiklar, (favoriter) =>
    withFavoritArtiklar(createDefaultFakturaArtikelState(), favoriter)
  );

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
