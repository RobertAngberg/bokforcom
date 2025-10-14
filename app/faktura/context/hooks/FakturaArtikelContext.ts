// Ger oss ett gemensamt ställe där artikeldata kan lagras och delas mellan komponenter.
// Tänk det som en global låda – hooken nedan tar ut innehållet så länge du ligger inuti providern.

"use client";

import { createContext, useContext } from "react";
import type { FakturaArtikelContextValue } from "../../types/types";

export const FakturaArtikelContext = createContext<FakturaArtikelContextValue | undefined>(
  undefined
);

// Anropa den här hooken när du vill hämta artikel-lådans innehåll från contexten.
export function useFakturaArtikelContext() {
  const context = useContext(FakturaArtikelContext);
  if (!context) {
    throw new Error("useFakturaArtikelContext must be used within a FakturaArtikelProvider");
  }

  return context;
}
