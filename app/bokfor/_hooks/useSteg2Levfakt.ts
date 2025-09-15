"use client";

import { useEffect, useState, useCallback } from "react";
import { datePickerOnChange } from "../../_utils/datum";
import { useBokforStore } from "../_stores/bokforStore";

export function useSteg2Levfakt() {
  // Hämta ALL data från Zustand store
  const {
    currentStep,
    levfaktMode,
    setLevfaktMode,
    fakturadatum,
    setFakturadatum,
    förfallodatum,
    setFörfallodatum,
    betaldatum,
    setBetaldatum,
    // Resterande data som komponenten behöver
    belopp,
    setBelopp,
    kommentar,
    setKommentar,
    setCurrentStep,
    fil,
    setFil,
    pdfUrl,
    setPdfUrl,
    transaktionsdatum,
    setTransaktionsdatum,
    valtFörval,
    extrafält,
    setExtrafält,
    leverantör,
    setLeverantör,
    fakturanummer,
    setFakturanummer,
  } = useBokforStore();

  const [visaLeverantorModal, setVisaLeverantorModal] = useState(false);

  // Datepicker styling och default värden
  useEffect(() => {
    const datePickerEls = document.querySelectorAll(".react-datepicker-wrapper");
    datePickerEls.forEach((el) => {
      (el as HTMLElement).style.width = "100%";
    });

    const inputEls = document.querySelectorAll(".react-datepicker__input-container input");
    inputEls.forEach((el) => {
      (el as HTMLElement).className =
        "w-full p-2 mb-4 rounded text-white bg-slate-900 border border-gray-700";
    });

    // Sätt default datum
    if (!fakturadatum && setFakturadatum) {
      setFakturadatum(datePickerOnChange(new Date()));
    }
    if (!förfallodatum && setFörfallodatum) {
      // Default 30 dagar från idag
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      setFörfallodatum(datePickerOnChange(thirtyDaysFromNow));
    }
    if (!betaldatum && setBetaldatum) {
      // Default betaldatum till idag
      setBetaldatum(datePickerOnChange(new Date()));
    }
  }, [fakturadatum, förfallodatum, betaldatum, setFakturadatum, setFörfallodatum, setBetaldatum]);

  // Callback functions
  const exitLevfaktMode = useCallback(() => {
    setLevfaktMode(false);
  }, [setLevfaktMode]);

  return {
    state: {
      currentStep,
      levfaktMode,
      fakturadatum,
      förfallodatum,
      betaldatum,
      belopp,
      kommentar,
      fil,
      pdfUrl,
      transaktionsdatum,
      valtFörval,
      extrafält,
      leverantör,
      fakturanummer,
      visaLeverantorModal,
    },
    actions: {
      setLevfaktMode,
      setFakturadatum,
      setFörfallodatum,
      setBetaldatum,
      setBelopp,
      setKommentar,
      setCurrentStep,
      setFil,
      setPdfUrl,
      setTransaktionsdatum,
      setExtrafält,
      setLeverantör,
      setFakturanummer,
      setVisaLeverantorModal,
    },
    handlers: {
      exitLevfaktMode,
    },
  };
}
