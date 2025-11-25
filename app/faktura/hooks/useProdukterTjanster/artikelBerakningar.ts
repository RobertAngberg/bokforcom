import type { Artikel, FakturaFormData } from "../../types/types";

export const RUT_KATEGORIER = [
  "Passa barn",
  "Fiber- och it-tjänster",
  "Flytta och packa",
  "Transport till försäljning för återanvändning",
  "Möblering",
  "Ta hand om en person och ge omsorg",
  "Reparera vitvaror",
  "Skotta snö",
  "Städa",
  "Tvätta, laga och sy",
  "Tvätt vid tvättinrättning",
  "Trädgårdsarbete – fälla och beskära träd",
  "Trädgårdsarbete – underhålla, klippa och gräva",
  "Tillsyn",
];

export const ROT_KATEGORIER = [
  "Bygg – reparera och underhålla",
  "Bygg – bygga om och bygga till",
  "El",
  "Glas och plåt",
  "Gräv- och markarbete",
  "Murning och sotning",
  "Målning och tapetsering",
  "Rengöring",
  "VVS",
];

function ärRotRutArbete(rad: Artikel): boolean {
  if (!rad.rotRutTyp) return false;
  if (typeof rad.rotRutArbete === "boolean") {
    return rad.rotRutArbete;
  }
  return rad.typ === "tjänst" && rad.rotRutMaterial !== true;
}

function ärRotRutMaterial(rad: Artikel): boolean {
  if (!rad.rotRutTyp) return false;
  if (typeof rad.rotRutMaterial === "boolean") {
    return rad.rotRutMaterial;
  }
  return false;
}

export function deriveArtikelMetrics(formData: FakturaFormData) {
  const rows = formData.artiklar ?? [];

  const sumExkl = rows.reduce((acc, rad) => {
    const antal = Number(rad.antal) || 0;
    const pris = Number(rad.prisPerEnhet) || 0;
    return acc + antal * pris;
  }, 0);

  const totalMoms = rows.reduce((acc, rad) => {
    const antal = Number(rad.antal) || 0;
    const pris = Number(rad.prisPerEnhet) || 0;
    const moms = Number(rad.moms) || 0;
    return acc + antal * pris * (moms / 100);
  }, 0);

  const sumInkl = sumExkl + totalMoms;

  const rotRutArtiklar = rows.filter((rad) => ärRotRutArbete(rad) || ärRotRutMaterial(rad));
  const harRotRutArtiklar = rotRutArtiklar.length > 0;
  const rotRutAktiverat = Boolean(formData.rotRutAktiverat || harRotRutArtiklar);
  const rotRutTyp = formData.rotRutTyp ?? rotRutArtiklar[0]?.rotRutTyp;

  const rotRutArbeteRader = rotRutArtiklar.filter(ärRotRutArbete);
  const rotRutMaterialRader = rotRutArtiklar.filter(ärRotRutMaterial);

  const rotRutTjänsterSumExkl = rotRutArbeteRader.reduce((acc, rad) => {
    const antal = Number(rad.antal) || 0;
    const pris = Number(rad.prisPerEnhet) || 0;
    return acc + antal * pris;
  }, 0);

  const rotRutTjänsterMoms = rotRutArbeteRader.reduce((acc, rad) => {
    const antal = Number(rad.antal) || 0;
    const pris = Number(rad.prisPerEnhet) || 0;
    const moms = Number(rad.moms) || 0;
    return acc + antal * pris * (moms / 100);
  }, 0);

  const rotRutTjänsterInklMoms = rotRutTjänsterSumExkl + rotRutTjänsterMoms;

  const rotRutMaterialSumExkl = rotRutMaterialRader.reduce((acc, rad) => {
    const antal = Number(rad.antal) || 0;
    const pris = Number(rad.prisPerEnhet) || 0;
    return acc + antal * pris;
  }, 0);

  const rotRutMaterialMoms = rotRutMaterialRader.reduce((acc, rad) => {
    const antal = Number(rad.antal) || 0;
    const pris = Number(rad.prisPerEnhet) || 0;
    const moms = Number(rad.moms) || 0;
    return acc + antal * pris * (moms / 100);
  }, 0);

  const rotRutMaterialInklMoms = rotRutMaterialSumExkl + rotRutMaterialMoms;

  const rotRutAvdrag =
    rotRutAktiverat && (rotRutTyp === "ROT" || rotRutTyp === "RUT")
      ? 0.5 * rotRutTjänsterInklMoms
      : 0;

  const summaAttBetala = Math.max(sumInkl - rotRutAvdrag, 0);

  const rotRutPersonnummer =
    formData.personnummer ||
    rotRutArbeteRader.find((rad) => rad.rotRutPersonnummer)?.rotRutPersonnummer ||
    rotRutMaterialRader.find((rad) => rad.rotRutPersonnummer)?.rotRutPersonnummer ||
    "";

  const rotRutTotalTimmar = rotRutArbeteRader.reduce(
    (sum, rad) => sum + (Number(rad.antal) || 0),
    0
  );

  const rotRutGenomsnittsPris =
    rotRutArbeteRader.length > 0
      ? rotRutArbeteRader.reduce((sum, rad) => sum + (Number(rad.prisPerEnhet) || 0), 0) /
        rotRutArbeteRader.length
      : 0;

  const rotRutAvdragProcent = rotRutTyp === "ROT" || rotRutTyp === "RUT" ? "50%" : "—";

  const shouldShowRotRut = Boolean(rotRutAktiverat && rotRutTyp);

  return {
    artiklar: rows,
    totals: {
      sumExkl,
      totalMoms,
      sumInkl,
      rotRutAvdrag,
      summaAttBetala,
    },
    rotRutSummary: {
      harRotRutArtiklar,
      rotRutTyp,
      rotRutTjänsterSumExkl,
      rotRutTjänsterMoms,
      rotRutTjänsterInklMoms,
      rotRutMaterialSumExkl,
      rotRutMaterialMoms,
      rotRutMaterialInklMoms,
      rotRutAvdrag,
      rotRutPersonnummer,
      rotRutTotalTimmar,
      rotRutGenomsnittsPris,
      rotRutAvdragProcent,
      rotRutArtiklarAntal: rotRutArtiklar.length,
      shouldShowRotRut,
    },
  };
}
