"use client";

import { useState, useCallback } from "react";
import { sanitizeFormInput } from "../../_utils/validationUtils";

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
  const [toast, setToast] = useState({
    message: "",
    type: "info" as "success" | "error" | "info",
    isVisible: false,
  });

  // Toast functions
  const showToast = useCallback((message: string, type: "success" | "error" | "info") => {
    setToast({ message, type, isVisible: true });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  }, []);

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

  // Spara ny anställd med toast-hantering
  const sparaNyAnställd = useCallback(
    async (onAnställdSparad?: () => void) => {
      try {
        setNyAnställdLoading(true);

        // Validera att obligatoriska fält är ifyllda
        if (!nyAnställdFormulär.förnamn || !nyAnställdFormulär.efternamn) {
          showToast("Förnamn och efternamn är obligatoriska", "error");
          return;
        }

        // Här skulle vi normalt anropa API:et för att spara anställd
        // För nu simulerar vi sparandet
        await new Promise((resolve) => setTimeout(resolve, 1000));

        showToast("Ny anställd sparad!", "success");
        rensaFormulär();
        setVisaNyAnställdFormulär(false);
        onAnställdSparad?.();
      } catch (error) {
        showToast("Fel vid sparande av anställd", "error");
      } finally {
        setNyAnställdLoading(false);
      }
    },
    [nyAnställdFormulär, showToast, rensaFormulär]
  );

  return {
    // State
    state: {
      nyAnställdFormulär,
      visaNyAnställdFormulär,
      nyAnställdLoading,
      toast,
    },

    // Actions
    actions: {
      updateNyAnställdFormulär,
      handleSanitizedChange,
      visaNyAnställd,
      döljNyAnställd,
      rensaFormulär,
      setNyAnställdLoading,
      sparaNyAnställd,
      showToast,
      hideToast,
    },
  };
}
