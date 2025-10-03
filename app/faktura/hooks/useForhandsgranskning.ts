"use client";

import { useState, useCallback } from "react";
import { useFakturaContext } from "../context/FakturaContext";
import { generatePDFFromElement } from "../utils/pdfGenerator";
import { showToast } from "../../_components/Toast";

// Types
import type { ForhandsgranskningCalculations } from "../types/types";

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
      formData.artiklar && formData.artiklar.some((artikel) => artikel.rotRutTyp);
    const rotRutTyp =
      formData.rotRutTyp ||
      (harROTRUTArtiklar
        ? formData.artiklar.find((artikel) => artikel.rotRutTyp)?.rotRutTyp
        : undefined);

    // Beräkna arbetskostnad bara för ROT/RUT-tjänster (inte material)
    const rotRutTjänsterSumExkl =
      formData.artiklar?.reduce((acc, rad) => {
        if (rad.typ === "tjänst" && rad.rotRutTyp && !rad.rotRutMaterial) {
          const antal = parseFloat(String(rad.antal) || "0");
          const pris = parseFloat(String(rad.prisPerEnhet) || "0");
          return acc + antal * pris;
        }
        return acc;
      }, 0) || 0;

    const rotRutTjänsterMoms =
      formData.artiklar?.reduce((acc, rad) => {
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
        formData.artiklar.find((artikel) => artikel.rotRutPersonnummer)?.rotRutPersonnummer);

    const shouldShowRotRut = Boolean(
      (formData.rotRutAktiverat || harROTRUTArtiklar) &&
        rotRutTyp &&
        (rotRutTyp === "ROT" || rotRutTyp === "RUT")
    );

    const rotRutArtiklar = formData.artiklar?.filter((a) => a.rotRutTyp) || [];
    const rotRutTotalTimmar = rotRutArtiklar.reduce((sum, a) => sum + (a.antal || 0), 0);
    const rotRutGenomsnittsPris =
      rotRutArtiklar.length > 0
        ? rotRutArtiklar.reduce((sum, a) => sum + (a.prisPerEnhet || 0), 0) / rotRutArtiklar.length
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
  // RETURN OBJECT
  // =============================================================================

  return {
    // State
    logoSliderValue,

    // State setters
    setLogoSliderValue,

    // Logo functions
    handleLogoSliderChange,

    // Beräkningar
    getForhandsgranskningCalculations,

    // PDF functions
    handleExportPDF,
  };
}
