"use client";

import { useCallback } from "react";
import { useFakturaClient } from "../context/hooks/FakturaContext";
import { stringTillDate, dateToYyyyMmDd } from "../../_utils/datum";

/**
 * Hook för betalnings- och datumhantering
 */
export function useBetalning() {
  const { formData, setFormData } = useFakturaClient();

  // Helper function för att lägga till dagar
  function addDays(date: Date, days: number) {
    const out = new Date(date);
    out.setDate(out.getDate() + days);
    return out;
  }

  // Uppdatera betalningsdatum baserat på fakturadatum och betalningsvillkor
  const updatePaymentDates = useCallback(
    (fakturadatum: Date, betalningsvillkor: string) => {
      const days = parseInt(betalningsvillkor) || 30;
      const forfallodatum = addDays(fakturadatum, days);

      setFormData({
        fakturadatum: dateToYyyyMmDd(fakturadatum),
        forfallodatum: dateToYyyyMmDd(forfallodatum),
      });
    },
    [setFormData]
  );

  // Event handler för datumfält
  const hanteraÄndraDatum = useCallback(
    (field: "fakturadatum" | "forfallodatum") => {
      return (d: Date | null) =>
        setFormData({
          [field]: d ? dateToYyyyMmDd(d) : "",
        });
    },
    [setFormData]
  );

  // Event handler för textfält
  const hanteraÄndradText = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;

      if (typeof value !== "string") {
        setFormData({ [name]: value });
        return;
      }

      setFormData({ [name]: value });
    },
    [setFormData]
  );

  // Event handler för dropdown
  const hanteraÄndradDropdown = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFormData({ [e.target.name]: e.target.value });
    },
    [setFormData]
  );

  // Beräknade datum-värden
  const fakturadatumDate = stringTillDate(formData.fakturadatum);
  const fallbackForfallo = fakturadatumDate
    ? addDays(fakturadatumDate, parseInt(formData.betalningsvillkor || "30", 10))
    : null;
  const forfalloDate = stringTillDate(formData.forfallodatum) ?? fallbackForfallo;

  return {
    // Functions
    addDays,
    updatePaymentDates,
    hanteraÄndraDatum,
    hanteraÄndradText,
    hanteraÄndradDropdown,

    // Computed values
    fakturadatumDate,
    forfalloDate,
  };
}
