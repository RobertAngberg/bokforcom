"use client";

import { useEffect } from "react";
import { LevfaktLayoutProps, UseLevfaktLayoutProps } from "../_types/types";

export function useLevfaktLayout({
  leverantör,
  fakturanummer,
  fakturadatum,
  isValid,
}: UseLevfaktLayoutProps) {
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

  const fullIsValid = isValid && leverantörIsValid && fakturanummerIsValid && fakturadatumIsValid;

  // Leverantör options (hardcoded för nu - detta kan göras mer dynamiskt senare)
  const leverantörOptions = [
    { label: "Välj leverantör...", value: "" },
    { label: "Telia", value: "telia" },
    { label: "Ellevio", value: "ellevio" },
    { label: "ICA", value: "ica" },
    { label: "Staples", value: "staples" },
    { label: "Office Depot", value: "office_depot" },
  ];

  // Datepicker styling effect
  useEffect(() => {
    const datePickerEls = document.querySelectorAll(".react-datepicker-wrapper");
    datePickerEls.forEach((el) => {
      (el as HTMLElement).style.width = "100%";
    });
  }, []);

  return {
    leverantörIsValid,
    fakturanummerIsValid,
    fakturadatumIsValid,
    fullIsValid,
    leverantörOptions,
  };
}
