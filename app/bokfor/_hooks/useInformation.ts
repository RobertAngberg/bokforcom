"use client";

import { useEffect, useCallback } from "react";
import { registerLocale } from "react-datepicker";
import { sv } from "date-fns/locale/sv";
import { useBokforStore } from "../_stores/bokforStore";
registerLocale("sv", sv);

export function useInformation() {
  // Hämta data från Zustand store
  const { belopp, setBelopp, transaktionsdatum, setTransaktionsdatum } = useBokforStore();
  // Säker beloppvalidering
  const handleBeloppChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const numValue = Number(value);

      // Begränsa till rimliga värden
      if (isNaN(numValue) || numValue < 0 || numValue > 999999999) {
        return; // Ignorera ogiltiga värden
      }

      setBelopp(numValue);
    },
    [setBelopp]
  );

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

  const handleTransaktionsdatumChange = useCallback(
    (date: Date | null) => {
      setTransaktionsdatum(date ? date.toISOString() : "");
    },
    [setTransaktionsdatum]
  );

  return {
    belopp,
    transaktionsdatum,
    handleBeloppChange,
    handleTransaktionsdatumChange,
    transaktionsdatumDate: transaktionsdatum ? new Date(transaktionsdatum) : new Date(),
  };
}
