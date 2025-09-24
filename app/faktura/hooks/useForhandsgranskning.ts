"use client";

import { useState, useCallback, useEffect } from "react";
import { useFakturaContext } from "../context/FakturaContext";
import { generatePDFFromElement, generatePDFAsBase64 } from "../utils/pdfGenerator";
import { showToast } from "../../_components/Toast";

// Types
import type { ForhandsgranskningCalculations, SkickaEpostProps } from "../types/types";

/**
 * Hook för förhandsgranskning, beräkningar och PDF/email funktionalitet
 */
export function useForhandsgranskning() {
  // Context state
  const context = useFakturaContext();
  const {
    state: { formData },
    setFormData,
  } = context;

  // Local state för förhandsgranskning
  const [logoSliderValue, setLogoSliderValue] = useState(() => {
    const initial = (((formData.logoWidth ?? 200) - 50) / 150) * 100;
    return initial;
  });

  // Email state
  const [isSending, setIsSending] = useState(false);
  const [mottagareEmail, setMottagareEmail] = useState("");
  const [egetMeddelande, setEgetMeddelande] = useState("");

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Uppdatera mottagarens e-post när kundens e-post ändras
  useEffect(() => {
    if (formData.kundemail && formData.kundemail.trim()) {
      setMottagareEmail(formData.kundemail);
    }
  }, [formData.kundemail]);

  // =============================================================================
  // LOGO FUNCTIONS
  // =============================================================================

  const handleLogoSliderChange = useCallback(
    (value: number) => {
      setLogoSliderValue(value);
      const calculated = 50 + (value / 100) * 150;
      setFormData({ logoWidth: calculated });
      localStorage.setItem("company_logoWidth", calculated.toString());
    },
    [setFormData]
  );

  // =============================================================================
  // BERÄKNINGAR
  // =============================================================================

  const getForhandsgranskningCalculations = useCallback((): ForhandsgranskningCalculations => {
    const rows = formData.artiklar || [];
    const logoSize = formData.logoWidth ?? 200;

    // Grundläggande summor
    const sumExkl = rows.reduce(
      (acc, rad) =>
        acc + parseFloat(String(rad.antal) || "0") * parseFloat(String(rad.prisPerEnhet) || "0"),
      0
    );

    const totalMoms = rows.reduce((acc, rad) => {
      const antal = parseFloat(String(rad.antal) || "0");
      const pris = parseFloat(String(rad.prisPerEnhet) || "0");
      const moms = parseFloat(String(rad.moms) || "0");
      return acc + antal * pris * (moms / 100);
    }, 0);

    // ROT/RUT-avdrag enligt Skatteverket: 50% av arbetskostnad inkl moms
    // Kolla om ROT/RUT är aktiverat på formulärnivå ELLER om det finns ROT/RUT-artiklar
    const harROTRUTArtiklar =
      formData.artiklar && formData.artiklar.some((artikel: any) => artikel.rotRutTyp);
    const rotRutTyp =
      formData.rotRutTyp ||
      (harROTRUTArtiklar &&
        (formData.artiklar as any[]).find((artikel: any) => artikel.rotRutTyp)?.rotRutTyp);

    // Beräkna arbetskostnad bara för ROT/RUT-tjänster (inte material)
    const rotRutTjänsterSumExkl =
      formData.artiklar?.reduce((acc, rad: any) => {
        if (rad.typ === "tjänst" && rad.rotRutTyp && !rad.rotRutMaterial) {
          const antal = parseFloat(String(rad.antal) || "0");
          const pris = parseFloat(String(rad.prisPerEnhet) || "0");
          return acc + antal * pris;
        }
        return acc;
      }, 0) || 0;

    const rotRutTjänsterMoms =
      formData.artiklar?.reduce((acc, rad: any) => {
        if (rad.typ === "tjänst" && rad.rotRutTyp && !rad.rotRutMaterial) {
          const antal = parseFloat(String(rad.antal) || "0");
          const pris = parseFloat(String(rad.prisPerEnhet) || "0");
          const moms = parseFloat(String(rad.moms) || "0");
          return acc + antal * pris * (moms / 100);
        }
        return acc;
      }, 0) || 0;

    const rotRutTjänsterInklMoms = rotRutTjänsterSumExkl + rotRutTjänsterMoms;
    const arbetskostnadInklMoms = sumExkl + totalMoms;

    // Avdrag bara på tjänstekostnaden, inte material
    const rotRutAvdrag =
      (formData.rotRutAktiverat || harROTRUTArtiklar) && rotRutTyp === "ROT"
        ? 0.5 * rotRutTjänsterInklMoms
        : (formData.rotRutAktiverat || harROTRUTArtiklar) && rotRutTyp === "RUT"
          ? 0.5 * rotRutTjänsterInklMoms
          : 0;

    const totalSum = arbetskostnadInklMoms - rotRutAvdrag;
    const summaAttBetala = Math.max(totalSum, 0);

    // ROT/RUT display beräkningar
    const rotRutPersonnummer =
      formData.personnummer ||
      (formData.artiklar &&
        (formData.artiklar as any[]).find((artikel: any) => artikel.rotRutPersonnummer)
          ?.rotRutPersonnummer);

    const shouldShowRotRut =
      (formData.rotRutAktiverat || harROTRUTArtiklar) &&
      rotRutTyp &&
      (rotRutTyp === "ROT" || rotRutTyp === "RUT");

    const rotRutArtiklar = formData.artiklar?.filter((a: any) => a.rotRutTyp) || [];
    const rotRutTotalTimmar = rotRutArtiklar.reduce(
      (sum: number, a: any) => sum + (a.antal || 0),
      0
    );
    const rotRutGenomsnittsPris =
      rotRutArtiklar.length > 0
        ? rotRutArtiklar.reduce((sum: number, a: any) => sum + (a.prisPerEnhet || 0), 0) /
          rotRutArtiklar.length
        : 0;

    const rotRutAvdragProcent = rotRutTyp === "ROT" || rotRutTyp === "RUT" ? "50%" : "—";

    // Legacy kompatibilitet
    const sumMoms = totalMoms;
    const sumInkl = sumExkl + totalMoms;

    return {
      rows,
      logoSliderValue,
      handleLogoSliderChange,
      logoSize,
      sumExkl,
      sumMoms,
      sumInkl,
      totalMoms,
      harROTRUTArtiklar,
      rotRutTyp,
      rotRutTjänsterSumExkl,
      rotRutTjänsterMoms,
      rotRutTjänsterInklMoms,
      arbetskostnadInklMoms,
      rotRutAvdrag,
      rotRutPersonnummer,
      rotRutTotalTimmar,
      rotRutGenomsnittsPris,
      rotRutAvdragProcent,
      shouldShowRotRut,
      totalSum,
      summaAttBetala,
    };
  }, [
    formData.artiklar,
    formData.logoWidth,
    formData.rotRutAktiverat,
    formData.rotRutTyp,
    formData.personnummer,
    logoSliderValue,
    handleLogoSliderChange,
  ]);

  // =============================================================================
  // PDF FUNCTIONS
  // =============================================================================

  const handleExportPDF = useCallback(async () => {
    try {
      const pdf = await generatePDFFromElement();
      pdf.save("faktura.pdf");
      showToast("PDF exporterad", "success");
    } catch (error) {
      console.error("❌ Error exporting PDF:", error);
      showToast("Kunde inte exportera PDF", "error");
    }
  }, []);

  // =============================================================================
  // EMAIL FUNCTIONS
  // =============================================================================

  // Validera e-postadress
  const validateEmail = useCallback((email: string): boolean => {
    if (!email.trim()) {
      showToast("Ange mottagarens e-postadress", "error");
      return false;
    }

    if (!email.includes("@")) {
      showToast("Ange en giltig e-postadress", "error");
      return false;
    }

    return true;
  }, []);

  // Skicka e-post
  const skickaEpost = useCallback(
    async (customProps?: Partial<SkickaEpostProps>) => {
      // Validering
      if (!validateEmail(mottagareEmail)) {
        return;
      }

      if (!formData.id) {
        showToast("Spara fakturan först innan du skickar den", "error");
        return;
      }

      setIsSending(true);

      try {
        // Generera PDF med den delade funktionen
        const pdfBase64 = await generatePDFAsBase64();

        // Skapa fakturanummer med nollutfyllnad
        const fakturaNr = formData.fakturanummer
          ? formData.fakturanummer.toString().padStart(4, "0")
          : "faktura";

        // Skicka e-post med PDF-bilaga och eget meddelande
        const response = await fetch("/api/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            faktura: {
              ...formData,
              kundemail: mottagareEmail, // Använd det angivna e-postfältet
            },
            pdfAttachment: pdfBase64,
            filename: `Faktura-${fakturaNr}.pdf`,
            customMessage: egetMeddelande.trim(), // Skicka med det egna meddelandet
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Kunde inte skicka e-post");
        }

        showToast("Faktura skickad till kunden!", "success");
        customProps?.onSuccess?.();
      } catch (error) {
        console.error("❌ E-postfel:", error);
        const errorMessage = error instanceof Error ? error.message : "Okänt fel";
        showToast(`Kunde inte skicka faktura: ${errorMessage}`, "error");
        customProps?.onError?.(errorMessage);
      } finally {
        setIsSending(false);
      }
    },
    [mottagareEmail, egetMeddelande, formData, validateEmail]
  );

  // E-post hjälpfunktioner
  const isEpostButtonDisabled = useCallback(() => {
    return isSending || !formData.fakturanummer || !mottagareEmail.trim() || !formData.id;
  }, [isSending, formData.fakturanummer, mottagareEmail, formData.id]);

  const getEpostButtonText = useCallback(() => {
    if (isSending) return "📤 Skickar...";
    if (!formData.id) return "❌ Spara faktura först";
    return "📧 Skicka faktura";
  }, [isSending, formData.id]);

  const getEpostStatusMessage = useCallback(() => {
    if (!formData.id) {
      return {
        type: "warning" as const,
        text: "Spara fakturan först innan du skickar den",
      };
    }

    return {
      type: "info" as const,
      text: `E-posten skickas till ${mottagareEmail || "ingen e-post angiven"}`,
    };
  }, [formData.id, mottagareEmail]);

  // =============================================================================
  // RETURN OBJECT
  // =============================================================================

  return {
    // State
    logoSliderValue,
    isSending,
    mottagareEmail,
    egetMeddelande,

    // State setters
    setLogoSliderValue,
    setMottagareEmail,
    setEgetMeddelande,

    // Logo functions
    handleLogoSliderChange,

    // Beräkningar
    getForhandsgranskningCalculations,

    // PDF functions
    handleExportPDF,

    // Email functions
    validateEmail,
    skickaEpost,
    isEpostButtonDisabled: isEpostButtonDisabled(),
    epostButtonText: getEpostButtonText(),
    epostStatusMessage: getEpostStatusMessage(),
    hasCustomerEmail: !!(formData.kundemail && formData.kundemail.trim()),
  };
}
