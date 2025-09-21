"use client";

import { useState, useEffect, useCallback } from "react";
import { registerLocale } from "react-datepicker";
import { sv } from "date-fns/locale/sv";
import { datePickerOnChange } from "../../_utils/datum";

registerLocale("sv", sv);

interface UseFormValidationProps {
  belopp: number | null;
  transaktionsdatum: string | null;
  fakturadatum: string | null;
  förfallodatum: string | null;
  betaldatum: string | null;
  setBelopp: (value: number | null) => void;
  setTransaktionsdatum: (value: string | null) => void;
  setFakturadatum?: (value: string | null) => void;
  setFörfallodatum?: (value: string | null) => void;
  setBetaldatum?: (value: string | null) => void;
}

export function useFormValidation({
  belopp,
  transaktionsdatum,
  fakturadatum,
  förfallodatum,
  betaldatum,
  setBelopp,
  setTransaktionsdatum,
  setFakturadatum,
  setFörfallodatum,
  setBetaldatum,
}: UseFormValidationProps) {
  // ====================================================
  // VALIDATION STATE
  // ====================================================
  const [beloppError, setBeloppError] = useState<string | null>(null);
  const [datumError, setDatumError] = useState<string | null>(null);

  // ====================================================
  // DATEPICKER STYLING SETUP
  // ====================================================

  // Setup för standarddatepicker (transaktionsdatum)
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

  // Setup för leverantörsfaktura datepickers (faktura-, förfallo-, betaldatum)
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

    // Sätt default datum för leverantörsfaktura
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

  // ====================================================
  // BELOPP VALIDATION
  // ====================================================

  const validateBelopp = useCallback((value: number): string | null => {
    if (isNaN(value)) {
      return "Beloppet måste vara ett giltigt nummer";
    }
    if (value < 0) {
      return "Beloppet kan inte vara negativt";
    }
    if (value > 999999999) {
      return "Beloppet är för stort";
    }
    if (value === 0) {
      return "Beloppet kan inte vara noll";
    }
    return null;
  }, []);

  const handleBeloppChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const numValue = Number(value);

      // Validera värdet
      const error = validateBelopp(numValue);
      setBeloppError(error);

      // Begränsa till rimliga värden
      if (isNaN(numValue) || numValue < 0 || numValue > 999999999) {
        return; // Ignorera ogiltiga värden
      }

      setBelopp(numValue);
    },
    [setBelopp, validateBelopp]
  );

  // ====================================================
  // DATUM VALIDATION OCH HANDLERS
  // ====================================================

  const validateDatum = useCallback((date: Date | null): string | null => {
    if (!date) {
      return "Datum måste anges";
    }

    const now = new Date();
    const maxDate = new Date(now.getFullYear() + 10, now.getMonth(), now.getDate());
    const minDate = new Date(now.getFullYear() - 10, now.getMonth(), now.getDate());

    if (date > maxDate) {
      return "Datumet kan inte vara mer än 10 år framåt";
    }
    if (date < minDate) {
      return "Datumet kan inte vara mer än 10 år bakåt";
    }

    return null;
  }, []);

  const handleTransaktionsdatumChange = useCallback(
    (date: Date | null) => {
      const error = validateDatum(date);
      setDatumError(error);
      setTransaktionsdatum(date ? date.toISOString() : "");
    },
    [setTransaktionsdatum, validateDatum]
  );

  const handleFakturadatumChange = useCallback(
    (date: Date | null) => {
      if (setFakturadatum) {
        const error = validateDatum(date);
        setDatumError(error);
        setFakturadatum(date ? datePickerOnChange(date) : null);
      }
    },
    [setFakturadatum, validateDatum]
  );

  const handleFörfallodatumChange = useCallback(
    (date: Date | null) => {
      if (setFörfallodatum) {
        const error = validateDatum(date);
        setDatumError(error);
        setFörfallodatum(date ? datePickerOnChange(date) : null);
      }
    },
    [setFörfallodatum, validateDatum]
  );

  const handleBetaldatumChange = useCallback(
    (date: Date | null) => {
      if (setBetaldatum) {
        const error = validateDatum(date);
        setDatumError(error);
        setBetaldatum(date ? datePickerOnChange(date) : null);
      }
    },
    [setBetaldatum, validateDatum]
  );

  // ====================================================
  // COMPUTED DATE VALUES
  // ====================================================

  const transaktionsdatumDate = transaktionsdatum ? new Date(transaktionsdatum) : new Date();
  const fakturadatumDate = fakturadatum ? new Date(fakturadatum) : new Date();
  const förfallodatumDate = förfallodatum ? new Date(förfallodatum) : null;
  const betaldatumDate = betaldatum ? new Date(betaldatum) : new Date();

  // ====================================================
  // VALIDATION STATUS
  // ====================================================

  const hasValidBelopp = belopp !== null && belopp > 0 && !beloppError;
  const hasValidTransaktionsdatum = transaktionsdatum !== null && !datumError;
  const isFormValid = hasValidBelopp && hasValidTransaktionsdatum;

  // ====================================================
  // CLEAR VALIDATION ERRORS
  // ====================================================

  const clearErrors = useCallback(() => {
    setBeloppError(null);
    setDatumError(null);
  }, []);

  // ====================================================
  // RETURN INTERFACE
  // ====================================================

  return {
    // Validation State
    beloppError,
    datumError,
    hasValidBelopp,
    hasValidTransaktionsdatum,
    isFormValid,

    // Input Handlers
    handleBeloppChange,
    handleTransaktionsdatumChange,
    handleFakturadatumChange,
    handleFörfallodatumChange,
    handleBetaldatumChange,

    // Date Objects for Datepickers
    transaktionsdatumDate,
    fakturadatumDate,
    förfallodatumDate,
    betaldatumDate,

    // Validation Functions
    validateBelopp,
    validateDatum,
    clearErrors,
  };
}
