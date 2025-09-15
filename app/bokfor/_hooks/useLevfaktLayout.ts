"use client";

import { useEffect } from "react";
import { useBokforStore } from "../_stores/bokforStore";
import { datePickerOnChange } from "../../_utils/datum";

export function useLevfaktLayout() {
  // Hämta all state från Zustand store
  const {
    belopp,
    transaktionsdatum,
    kommentar,
    fil,
    pdfUrl,
    leverantör,
    fakturanummer,
    fakturadatum,
    förfallodatum,
    setBelopp,
    setTransaktionsdatum,
    setKommentar,
    setFil,
    setPdfUrl,
    setLeverantör,
    setFakturanummer,
    setFakturadatum,
    setFörfallodatum,
    setCurrentStep,
  } = useBokforStore();

  // Layout-specifika värden
  const title = "Leverantörsfaktura";

  // Submit-hantering (kan anpassas baserat på context)
  const handleSubmit = () => {
    // Här kan vi lägga till submit-logik senare
    console.log("Leverantörsfaktura bokföring...");
  };

  // Extra validering för leverantörsfaktura-specifika fält
  const leverantörIsValid =
    leverantör &&
    (typeof leverantör === "string"
      ? leverantör.trim() !== ""
      : typeof leverantör === "object" && leverantör.namn && leverantör.namn.trim() !== "");

  const fakturanummerIsValid =
    fakturanummer && typeof fakturanummer === "string" && fakturanummer.trim() !== "";

  const fakturadatumIsValid =
    fakturadatum && typeof fakturadatum === "string" && fakturadatum.trim() !== "";

  // Grundläggande validering (belopp, transaktionsdatum, fil)
  const grundIsValid = belopp && belopp > 0 && transaktionsdatum && fil;

  const fullIsValid =
    grundIsValid && leverantörIsValid && fakturanummerIsValid && fakturadatumIsValid;

  // Leverantör options (hardcoded för nu - detta kan göras mer dynamiskt senare)
  const leverantörOptions = [
    { label: "Välj leverantör...", value: "" },
    { label: "Telia", value: "telia" },
    { label: "Ellevio", value: "ellevio" },
    { label: "ICA", value: "ica" },
    { label: "Staples", value: "staples" },
    { label: "Office Depot", value: "office_depot" },
  ];

  // Sätt default datum vid första render
  useEffect(() => {
    if (!fakturadatum) {
      setFakturadatum(datePickerOnChange(new Date()));
    }
    if (!förfallodatum) {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      setFörfallodatum(datePickerOnChange(thirtyDaysFromNow));
    }
  }, [fakturadatum, förfallodatum, setFakturadatum, setFörfallodatum]);

  // Datepicker styling effect
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
  }, []);

  return {
    // State values
    belopp,
    transaktionsdatum,
    kommentar,
    fil,
    pdfUrl,
    leverantör,
    fakturanummer,
    fakturadatum,
    förfallodatum,

    // Actions
    setBelopp,
    setTransaktionsdatum,
    setKommentar,
    setFil,
    setPdfUrl,
    setLeverantör,
    setFakturanummer,
    setFakturadatum,
    setFörfallodatum,
    setCurrentStep,

    // Layout
    title,
    onSubmit: handleSubmit,

    // Validering
    leverantörIsValid,
    fakturanummerIsValid,
    fakturadatumIsValid,
    fullIsValid,

    // Options
    leverantörOptions,
  };
}
