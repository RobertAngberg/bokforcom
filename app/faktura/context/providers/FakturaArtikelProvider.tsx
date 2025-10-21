"use client";

import { useCallback, useMemo, useReducer } from "react";
import { FakturaArtikelContext } from "../defaults/FakturaArtikelDefaults";
import {
  createDefaultFakturaArtikelState,
  createDefaultNyArtikel,
} from "../defaults/FakturaArtikelDefaults";
import type {
  FakturaArtikelAction,
  FakturaArtikelProviderProps,
  FakturaArtikelState,
  FavoritArtikel,
  NyArtikel,
} from "../../types/types";

function fakturaArtikelReducer(
  state: FakturaArtikelState,
  action: FakturaArtikelAction
): FakturaArtikelState {
  switch (action.type) {
    case "SET_STATE":
      return { ...state, ...action.payload };
    case "RESET_STATE":
      return {
        ...createDefaultFakturaArtikelState(),
        favoritArtiklar: [...state.favoritArtiklar],
      };
    case "SET_NY_ARTIKEL":
      return {
        ...state,
        nyArtikel: { ...state.nyArtikel, ...action.payload },
      };
    case "RESET_NY_ARTIKEL":
      return {
        ...state,
        nyArtikel: createDefaultNyArtikel(),
      };
    case "SET_FAVORIT_ARTIKLAR":
      return {
        ...state,
        favoritArtiklar: [...action.payload],
      };
    default:
      return state;
  }
}

function buildInitialState(initialFavoritArtiklar?: FavoritArtikel[]): FakturaArtikelState {
  const base = createDefaultFakturaArtikelState();
  if (Array.isArray(initialFavoritArtiklar)) {
    base.favoritArtiklar = [...initialFavoritArtiklar];
  }
  return base;
}

export function FakturaArtikelProvider({
  children,
  initialFavoritArtiklar,
}: FakturaArtikelProviderProps) {
  const [state, dispatch] = useReducer(
    fakturaArtikelReducer,
    initialFavoritArtiklar,
    (favoriter?: FavoritArtikel[]) => buildInitialState(favoriter)
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

  const contextValue = useMemo(
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

  return (
    <FakturaArtikelContext.Provider value={contextValue}>{children}</FakturaArtikelContext.Provider>
  );
}
