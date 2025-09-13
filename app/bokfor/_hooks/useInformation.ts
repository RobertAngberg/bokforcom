"use client";

import { useEffect } from "react";
import { registerLocale } from "react-datepicker";
import { sv } from "date-fns/locale/sv";
import { UseInformationProps } from "../_types/types";
registerLocale("sv", sv);

export function useInformation({
  belopp,
  setBelopp,
  transaktionsdatum,
  setTransaktionsdatum,
  visaFakturadatum = false,
  fakturadatum,
  setFakturadatum,
}: UseInformationProps) {
  // Säker beloppvalidering
  const handleBeloppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = Number(value);

    // Begränsa till rimliga värden
    if (isNaN(numValue) || numValue < 0 || numValue > 999999999) {
      return; // Ignorera ogiltiga värden
    }

    setBelopp(numValue);
  };

  // Datepicker setup
  useEffect(() => {
    const datePickerEl = document.querySelector(".react-datepicker-wrapper");
    if (datePickerEl) {
      (datePickerEl as HTMLElement).style.width = "100%";
    }

    const inputEl = document.querySelector(".react-datepicker__input-container input");
    if (inputEl) {
      (inputEl as HTMLElement).className =
        "w-full p-2 mb-4 rounded text-white bg-slate-900 border border-gray-700";
    }

    if (!transaktionsdatum) {
      // Default dagens datum
      setTransaktionsdatum(new Date().toISOString());
    }
  }, [transaktionsdatum, setTransaktionsdatum]);

  const handleTransaktionsdatumChange = (date: Date | null) => {
    setTransaktionsdatum(date ? date.toISOString() : "");
  };

  const handleFakturadatumChange = (date: Date | null) => {
    if (setFakturadatum) {
      setFakturadatum(date ? date.toISOString() : "");
    }
  };

  return {
    handleBeloppChange,
    handleTransaktionsdatumChange,
    handleFakturadatumChange,
    transaktionsdatumDate: transaktionsdatum ? new Date(transaktionsdatum) : new Date(),
    fakturadatumDate: fakturadatum ? new Date(fakturadatum) : new Date(),
  };
}
