// Ger oss ett gemensamt ställe där artikeldata kan lagras och delas mellan komponenter.
// Tänk det som en global låda – hooken nedan tar ut innehållet så länge du ligger inuti providern.

"use client";

import { useContext } from "react";
import { FakturaArtikelContext } from "../defaults/FakturaArtikelDefaults";

// Anropa den här hooken när du vill hämta artikel-lådans innehåll från contexten.
export function useFakturaArtikelContext() {
  const context = useContext(FakturaArtikelContext);
  if (!context) {
    throw new Error("useFakturaArtikelContext must be used within a FakturaArtikelProvider");
  }

  return context;
}
