"use client";

import { useState, useCallback, useEffect, useActionState } from "react";
import { showToast } from "../../_components/Toast";
import { sparaNyAnställdFormAction } from "../actions/anstalldaActions";
import type { UseNyAnstalldOptions } from "../types/types";

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

const initialActionResult = {
  success: false,
  message: "",
};

export function useNyAnstalld({ onSaved, onCancel }: UseNyAnstalldOptions = {}) {
  const [nyAnställdFormulär, setNyAnställdFormulär] = useState(initialNyAnställdFormulär);
  const [visaNyAnställdFormulär, setVisaNyAnställdFormulär] = useState(false);
  const [nyAnställdLoading, setNyAnställdLoading] = useState(false);

  const [actionState, formAction, isPending] = useActionState(
    sparaNyAnställdFormAction,
    initialActionResult
  );

  // Tillbaka till enkel state management - useActionState ska användas på form-nivå istället!

  // Update formulär with partial data
  const updateNyAnställdFormulär = useCallback((updates: Partial<typeof nyAnställdFormulär>) => {
    console.log("🔄 updateNyAnställdFormulär - updates:", updates);
    setNyAnställdFormulär((prev) => {
      const newState = { ...prev, ...updates };
      console.log("🔄 updateNyAnställdFormulär - prev state:", prev);
      console.log("🔄 updateNyAnställdFormulär - new state:", newState);
      return newState;
    });
  }, []);

  // Handle input changes
  const handleSanitizedChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;

      console.log("🔍 handleSanitizedChange - input:", {
        name,
        value,
        valueLength: value.length,
      });

      updateNyAnställdFormulär({ [name]: value });

      // Hide toast on input change if visible
    },
    [updateNyAnställdFormulär]
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

  const avbrytNyAnställd = useCallback(() => {
    rensaFormulär();
    döljNyAnställd();
    void onCancel?.();
  }, [döljNyAnställd, onCancel, rensaFormulär]);

  useEffect(() => {
    if (!actionState) return;

    if (actionState.success) {
      showToast(actionState.message || "Anställd sparad!", "success");
      rensaFormulär();
      döljNyAnställd();
      void onSaved?.();
    } else if (actionState.message) {
      showToast(actionState.message, "error");
    }
  }, [actionState, döljNyAnställd, onSaved, rensaFormulär]);

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
      avbrytNyAnställd,
    },
    form: {
      actionState,
      formAction,
      isPending,
    },
  };
}
