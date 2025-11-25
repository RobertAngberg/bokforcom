"use client";

import { useCallback } from "react";
import type { ChangeEvent } from "react";
import { dateToYyyyMmDd } from "../../../_utils/datum";
import { useFakturaFormActions } from "../../context/hooks/FakturaFormContext";

export function useRotRutForm() {
  const { setFormData } = useFakturaFormActions();

  const handleRotRutChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      let finalValue: string | boolean = value;

      if (e.target instanceof HTMLInputElement && e.target.type === "checkbox") {
        finalValue = e.target.checked;
      }

      if (name === "rotRutAktiverat" && finalValue === false) {
        setFormData({
          rotRutAktiverat: false,
          rotRutTyp: undefined,
          rotRutKategori: undefined,
          avdragProcent: undefined,
          arbetskostnadExMoms: undefined,
          avdragBelopp: undefined,
          personnummer: undefined,
          fastighetsbeteckning: undefined,
          rotBoendeTyp: undefined,
          brfOrganisationsnummer: undefined,
          brfLagenhetsnummer: undefined,
        });
        return;
      }

      if (name === "rotRutTyp") {
        const procent = value === "ROT" || value === "RUT" ? 50 : undefined;
        const isActive = value === "ROT" || value === "RUT";

        setFormData({
          rotRutAktiverat: isActive,
          rotRutTyp: isActive ? (value as "ROT" | "RUT") : undefined,
          avdragProcent: procent,
          rotRutKategori: undefined,
        });
        return;
      }

      setFormData({ [name]: finalValue });
    },
    [setFormData]
  );

  const handleRotRutBoendeTypChange = useCallback(
    (typ: "fastighet" | "brf") => {
      setFormData({ rotBoendeTyp: typ });
    },
    [setFormData]
  );

  const handleRotRutDateChange = useCallback(
    (field: string, date: Date | null) => {
      setFormData({ [field]: date ? dateToYyyyMmDd(date) : undefined });
    },
    [setFormData]
  );

  return {
    handleRotRutChange,
    handleRotRutBoendeTypChange,
    handleRotRutDateChange,
  };
}
