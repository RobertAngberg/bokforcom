"use client";

import { useBokforState, useBokforActions } from "../_stores/BokforStoreProvider";

export function useStandardLayout(onSubmit?: () => void, title?: string) {
  // Hämta all state från nya Context providers
  const state = useBokforState();
  const actions = useBokforActions();

  const { belopp, transaktionsdatum, kommentar, fil, pdfUrl } = state;

  const { setBelopp, setTransaktionsdatum, setKommentar, setFil, setPdfUrl, setCurrentStep } =
    actions;

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
