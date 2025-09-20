"use client";

import { useState, useCallback } from "react";
import { sanitizeFormInput } from "../../_utils/validationUtils";
import { useToast } from "./useToast";

const initialNyAnställdFormulär = {
  // Personal information
  förnamn: "",
  efternamn: "",
  personnummer: "",
  jobbtitel: "",
  clearingnummer: "",
  bankkonto: "",
  mail: "",
  adress: "",
  postnummer: "",
  ort: "",

  // Dates
  startdatum: new Date(),
  slutdatum: (() => {
    const datum = new Date();
    datum.setFullYear(datum.getFullYear() + 1);
    return datum;
  })(),

  // Employment details
  anställningstyp: "",
  löneperiod: "",
  ersättningPer: "",
  kompensation: "",
  arbetsvecka: "",
  arbetsbelastning: "",
  deltidProcent: "",

  // Workplace
  tjänsteställeAdress: "",
  tjänsteställeOrt: "",

  // Tax information
  skattetabell: "",
  skattekolumn: "",
  växaStöd: false,
};

export function useNyAnstalld() {
  const [nyAnställdFormulär, setNyAnställdFormulär] = useState(initialNyAnställdFormulär);
  const [visaNyAnställdFormulär, setVisaNyAnställdFormulär] = useState(false);
  const [nyAnställdLoading, setNyAnställdLoading] = useState(false);

  const { hideToast } = useToast();

  // Update formulär with partial data
  const updateNyAnställdFormulär = useCallback((updates: Partial<typeof nyAnställdFormulär>) => {
    setNyAnställdFormulär((prev) => ({ ...prev, ...updates }));
  }, []);

  // Handle sanitized input changes
  const handleSanitizedChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;

      const sanitizedValue = [
        "förnamn",
        "efternamn",
        "jobbtitel",
        "mail",
        "adress",
        "ort",
      ].includes(name)
        ? sanitizeFormInput(value)
        : value;

      updateNyAnställdFormulär({ [name]: sanitizedValue });

      // Hide toast on input change if visible
      hideToast();
    },
    [updateNyAnställdFormulär, hideToast]
  );

  // Show/hide formulär
  const visaNyAnställd = useCallback(() => {
    setVisaNyAnställdFormulär(true);
  }, []);

  const döljNyAnställd = useCallback(() => {
    setVisaNyAnställdFormulär(false);
  }, []);

  // Reset formulär
  const rensaFormulär = useCallback(() => {
    setNyAnställdFormulär(initialNyAnställdFormulär);
  }, []);

  return {
    // State
    state: {
      nyAnställdFormulär,
      visaNyAnställdFormulär,
      nyAnställdLoading,
    },

    // Actions
    actions: {
      updateNyAnställdFormulär,
      handleSanitizedChange,
      visaNyAnställd,
      döljNyAnställd,
      rensaFormulär,
      setNyAnställdLoading,
    },
  };
}
