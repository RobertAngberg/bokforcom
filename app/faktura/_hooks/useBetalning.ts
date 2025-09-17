"use client";

import { useEffect } from "react";
import { useFakturaClient } from "../_stores/fakturaStore";
import { registerLocale } from "react-datepicker";
import { sv } from "date-fns/locale";
import { hämtaSenasteBetalningsmetod } from "../_actions/alternativActions";
import { useSession } from "next-auth/react";

export function useBetalning() {
  const { formData, setFormData } = useFakturaClient();
  const { data: session } = useSession();

  // Registrera svensk locale för datepicker
  registerLocale("sv", sv);

  // Hjälpfunktioner
  function parseISODate(value: unknown): Date | null {
    if (value instanceof Date && !isNaN(value.getTime())) return value;
    if (typeof value === "string") {
      const d = new Date(value.trim());
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  }

  function addDays(date: Date, days: number) {
    const out = new Date(date);
    out.setDate(out.getDate() + days);
    return out;
  }

  // Sätter standardvärden + hämtar senaste betalningsmetod
  useEffect(() => {
    const initializeDefaults = async () => {
      const todayISO = new Date().toISOString().slice(0, 10);

      // ✅ Hämta SENASTE betalningsmetod för denna användare
      let senasteBetalning = { betalningsmetod: null, nummer: null };

      if (session?.user?.id) {
        senasteBetalning = await hämtaSenasteBetalningsmetod(session.user.id);
      }

      setFormData({
        fakturadatum: formData.fakturadatum || todayISO,
        betalningsvillkor: formData.betalningsvillkor || "30",
        drojsmalsranta: formData.drojsmalsranta || "12",
        betalningsmetod: formData.betalningsmetod || senasteBetalning.betalningsmetod || "",
        nummer: formData.nummer || senasteBetalning.nummer || "",
        forfallodatum:
          formData.forfallodatum ||
          (formData.fakturadatum
            ? addDays(
                new Date(formData.fakturadatum),
                parseInt(formData.betalningsvillkor || "30", 10)
              )
                .toISOString()
                .slice(0, 10)
            : ""),
      });
    };

    // ✅ Kör bara när session är laddad
    if (session?.user?.id) {
      initializeDefaults();
    }
  }, [session?.user?.id]); // Ta bort setFormData från dependencies

  // Beräknade datum-värden
  const fakturadatumDate = parseISODate(formData.fakturadatum);
  const fallbackForfallo = fakturadatumDate
    ? addDays(fakturadatumDate, parseInt(formData.betalningsvillkor || "30", 10))
    : null;
  const forfalloDate = parseISODate(formData.forfallodatum) ?? fallbackForfallo;

  // Sätter förfallodatum automatiskt BARA om det är tomt (låter användaren ändra manuellt)
  useEffect(() => {
    if (!fakturadatumDate || formData.forfallodatum) return; // ✅ Kör bara om förfallodatum är tomt
    const days = parseInt(formData.betalningsvillkor || "30", 10);
    const calc = addDays(fakturadatumDate, isNaN(days) ? 30 : days)
      .toISOString()
      .slice(0, 10);
    setFormData({ forfallodatum: calc });
  }, [fakturadatumDate, formData.betalningsvillkor, formData.forfallodatum]); // Ta bort setFormData

  // Event handlers
  function hanteraÄndraDatum(field: "fakturadatum" | "forfallodatum") {
    return (d: Date | null) =>
      setFormData({
        [field]: d ? d.toISOString().slice(0, 10) : "",
      });
  }

  function hanteraÄndradText(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;

    // Blockera farliga tecken för nummer-fältet
    if (name === "nummer") {
      const sanitizedValue = value.replace(/[<>'"&]/g, "");
      setFormData({ [name]: sanitizedValue });
      return;
    }

    setFormData({ [name]: value });
  }

  function hanteraÄndradDropdown(e: React.ChangeEvent<HTMLSelectElement>) {
    setFormData({ [e.target.name]: e.target.value });
  }

  return {
    // Data
    formData,
    fakturadatumDate,
    forfalloDate,

    // Handlers
    hanteraÄndraDatum,
    hanteraÄndradText,
    hanteraÄndradDropdown,
  };
}
