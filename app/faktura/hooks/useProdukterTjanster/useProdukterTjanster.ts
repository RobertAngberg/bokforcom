"use client";

import { useMemo } from "react";
import { useFakturaForm } from "../../context/hooks/FakturaFormContext";
import { useArtikelForm } from "./useArtikelForm";
import { useFavoritArtiklar } from "./useFavoritArtiklar";
import { useRotRutForm } from "./useRotRutForm";
import { deriveArtikelMetrics, RUT_KATEGORIER, ROT_KATEGORIER } from "./artikelBerakningar";
import type { FavoritArtikel } from "../../types/types";

export function useProdukterTjanster() {
  const formData = useFakturaForm();
  const metrics = useMemo(() => deriveArtikelMetrics(formData), [formData]);

  const artikelForm = useArtikelForm();
  const favoritArtiklar = useFavoritArtiklar();
  const rotRutForm = useRotRutForm();

  return {
    nyArtikel: artikelForm.nyArtikel,
    redigerarIndex: artikelForm.redigerarIndex,
    visaArtikelForm: artikelForm.visaArtikelForm,
    visaArtikelModal: artikelForm.visaArtikelModal,
    favoritArtikelVald: artikelForm.favoritArtikelVald,
    ursprungligFavoritId: artikelForm.ursprungligFavoritId,
    artikelSparadSomFavorit: artikelForm.artikelSparadSomFavorit,
    valtArtikel: artikelForm.valtArtikel,
    blinkIndex: artikelForm.blinkIndex,
    visaRotRutForm: artikelForm.visaRotRutForm,
    favoritArtiklar: favoritArtiklar.favoritArtiklar,
    showFavoritArtiklar: favoritArtiklar.showFavoritArtiklar,
    showDeleteFavoritModal: favoritArtiklar.showDeleteFavoritModal,
    deleteFavoritId: favoritArtiklar.deleteFavoritId,
    artiklar: metrics.artiklar,
    harArtiklar: metrics.artiklar.length > 0,
    totals: metrics.totals,
    rotRutSummary: metrics.rotRutSummary,
    standardValuta: metrics.artiklar[0]?.valuta ?? "SEK",
    RUT_KATEGORIER,
    ROT_KATEGORIER,
    läggTillArtikel: artikelForm.läggTillArtikel,
    startRedigeraArtikel: artikelForm.startRedigeraArtikel,
    avbrytRedigering: artikelForm.avbrytRedigering,
    taBortArtikel: artikelForm.taBortArtikel,
    uppdateraArtikelRotRutArbete: artikelForm.uppdateraArtikelRotRutArbete,
    uppdateraArtikelRotRutMaterial: artikelForm.uppdateraArtikelRotRutMaterial,
    updateArtikel: artikelForm.updateArtikel,
    setBeskrivning: artikelForm.setBeskrivning,
    setAntal: artikelForm.setAntal,
    setPrisPerEnhet: artikelForm.setPrisPerEnhet,
    setMoms: artikelForm.setMoms,
    setValuta: artikelForm.setValuta,
    setTyp: artikelForm.setTyp,
    setRotRutArbete: artikelForm.setRotRutArbete,
    setRotRutMaterial: artikelForm.setRotRutMaterial,
    resetNyArtikel: artikelForm.resetNyArtikel,
    setVisaArtikelForm: artikelForm.setVisaArtikelForm,
    setVisaArtikelModal: artikelForm.setVisaArtikelModal,
    setRedigerarIndex: artikelForm.setRedigerarIndex,
    setFavoritArtikelVald: artikelForm.setFavoritArtikelVald,
    setUrsprungligFavoritId: artikelForm.setUrsprungligFavoritId,
    setArtikelSparadSomFavorit: artikelForm.setArtikelSparadSomFavorit,
    setValtArtikel: artikelForm.setValtArtikel,
    setBlinkIndex: artikelForm.setBlinkIndex,
    setVisaRotRutForm: artikelForm.setVisaRotRutForm,
    laddaSparadeArtiklar: favoritArtiklar.laddaSparadeArtiklar,
    sparaArtikelSomFavorit: () =>
      favoritArtiklar.sparaArtikelSomFavorit(
        artikelForm.nyArtikel,
        {
          rotRutTyp: formData.rotRutTyp,
          rotRutKategori: formData.rotRutKategori,
          avdragProcent: formData.avdragProcent,
          arbetskostnadExMoms:
            typeof formData.arbetskostnadExMoms === "number"
              ? formData.arbetskostnadExMoms
              : Number(formData.arbetskostnadExMoms) || undefined,
        },
        artikelForm.visaRotRutForm
      ),
    taBortFavoritArtikel: favoritArtiklar.taBortFavoritArtikel,
    confirmDeleteFavorit: favoritArtiklar.confirmDeleteFavorit,
    laddaFavoritArtikel: (artikel: FavoritArtikel) =>
      favoritArtiklar.laddaFavoritArtikel(artikel, metrics.artiklar),
    setShowFavoritArtiklar: favoritArtiklar.setShowFavoritArtiklar,
    setShowDeleteFavoritModal: favoritArtiklar.setShowDeleteFavoritModal,
    handleRotRutChange: rotRutForm.handleRotRutChange,
    handleRotRutBoendeTypChange: rotRutForm.handleRotRutBoendeTypChange,
    handleRotRutDateChange: rotRutForm.handleRotRutDateChange,
  };
}
