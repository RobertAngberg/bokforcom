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
    state: {
      belopp,
      transaktionsdatum,
      kommentar,
      fil,
      pdfUrl,
      isValid,
      title: title || "Standard bokföring",
    },
    handlers: {
      setBelopp,
      setTransaktionsdatum,
      setKommentar,
      setFil,
      setPdfUrl,
      setCurrentStep,
      onSubmit: onSubmit || (() => {}),
    },
  };
}
