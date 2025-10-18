// Här ligger små hjälpfunktioner som skapar ett “grundpaket” av artikeldata åt oss.
// När du kallar dem får du ett färdigifyllt objekt, så du slipper skriva alla startvärden för hand.

import { createContext } from "react";
import type {
  FakturaArtikelContextValue,
  FavoritArtikel,
  FakturaArtikelState,
  NyArtikel,
} from "../../types/types";

export const FakturaArtikelContext = createContext<FakturaArtikelContextValue | undefined>(
  undefined
);

const baseNyArtikel: NyArtikel = {
  beskrivning: "",
  antal: "",
  prisPerEnhet: "",
  moms: "25",
  valuta: "SEK",
  typ: "tjänst",
  rotRutArbete: true,
  rotRutMaterial: false,
};

// Ger dig ett tomt artikelobjekt så du kan börja fylla i det utan att oroa dig för startvärden.
export function createDefaultNyArtikel(): NyArtikel {
  return { ...baseNyArtikel };
}

// Skapar hela grundläget för artikeldelen så allt börjar i ett förutsägbart nuläge.
export function createDefaultFakturaArtikelState(): FakturaArtikelState {
  return {
    nyArtikel: createDefaultNyArtikel(),
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
}

// Stoppar in favoritartiklar i det givna statet så listan alltid är en riktig array.
export function withFavoritArtiklar(
  state: FakturaArtikelState,
  artiklar: FavoritArtikel[] | undefined
): FakturaArtikelState {
  return {
    ...state,
    favoritArtiklar: Array.isArray(artiklar) ? artiklar : [],
  };
}
