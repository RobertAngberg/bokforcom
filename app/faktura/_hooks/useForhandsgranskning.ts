"use client";

import { useState } from "react";
import { useFakturaStore } from "../_stores/fakturaStore";
import { ForhandsgranskningCalculations } from "../_types/types";

export function useForhandsgranskning(): ForhandsgranskningCalculations {
  const formData = useFakturaStore((state) => state.formData);
  const updateFormField = useFakturaStore((state) => state.setFormData);

  const rows = formData.artiklar || [];

  // Logotypstorlek-slider (endast i preview)
  const initialSlider = (((formData.logoWidth ?? 200) - 50) / 150) * 100;
  const [logoSliderValue, setLogoSliderValue] = useState(initialSlider);

  const handleLogoSliderChange = (value: number) => {
    setLogoSliderValue(value);
    const calculated = 50 + (value / 100) * 150;
    updateFormField({ logoWidth: calculated });
    localStorage.setItem("company_logoWidth", calculated.toString());
  };

  const logoSize = formData.logoWidth ?? 200;

  // Summeringsberäkningar
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
  const rotRutTotalTimmar = rotRutArtiklar.reduce((sum: number, a: any) => sum + (a.antal || 0), 0);
  const rotRutGenomsnittsPris =
    rotRutArtiklar.length > 0
      ? rotRutArtiklar.reduce((sum: number, a: any) => sum + (a.prisPerEnhet || 0), 0) /
        rotRutArtiklar.length
      : 0;

  const rotRutAvdragProcent = rotRutTyp === "ROT" || rotRutTyp === "RUT" ? "50%" : "—";

  return {
    sumExkl,
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
    logoSize,
    logoSliderValue,
    handleLogoSliderChange,
  };
}
