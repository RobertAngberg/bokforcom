"use client";

import { useBokforStore } from "../_stores/bokforStore";

export function useStandardLayout(onSubmit?: () => void, title?: string) {
  // Hämta all state från Zustand store
  const {
    belopp,
    transaktionsdatum,
    kommentar,
    fil,
    pdfUrl,
    setBelopp,
    setTransaktionsdatum,
    setKommentar,
    setFil,
    setPdfUrl,
    setCurrentStep,
  } = useBokforStore();

  // Grundläggande validering för standard layout
  const isValid = belopp && belopp > 0 && transaktionsdatum && fil;
  return {
    // State values
    belopp,
    transaktionsdatum,
    kommentar,
    fil,
    pdfUrl,

    // Actions
    setBelopp,
    setTransaktionsdatum,
    setKommentar,
    setFil,
    setPdfUrl,
    setCurrentStep,

    // Layout
    title: title || "Standard bokföring",
    onSubmit: onSubmit || (() => {}),

    // Validering
    isValid,
  };
}
