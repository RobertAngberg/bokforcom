"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { registerLocale } from "react-datepicker";
import { sv } from "date-fns/locale";
import { useFakturaClient } from "../context/hooks/FakturaContext";
import { useProdukterTjanster } from "./useProdukterTjanster/useProdukterTjanster";
import { useBetalning } from "./useBetalning";
import { useAvsandare } from "./useAvsandare";
import { useKundUppgifter } from "./useKundUppgifter";
import { useFakturaData } from "./useFakturaData";
import { showToast } from "../../_components/Toast";
import type { FakturaFormData } from "../types/types";

/**
 * Huvudhook för alla faktura-relaterade funktioner
 * Komponerar flera domän-specifika hooks
 */
export function useFaktura() {
  // Context state
  const {
    formData,
    kundStatus,
    resetFormData,
    setKundStatus,
    resetKund,
    setFormData,
    userSettings,
    navigationState,
    setBokföringsmetod,
  } = useFakturaClient();

  // Sub-hooks
  const betalning = useBetalning();
  const avsandare = useAvsandare();
  const kundUppgifter = useKundUppgifter();
  const fakturaData = useFakturaData();

  // Artikel hook
  const artikelContext = useProdukterTjanster();
  const {
    nyArtikel,
    favoritArtiklar,
    showFavoritArtiklar,
    blinkIndex,
    visaRotRutForm,
    visaArtikelForm,
    visaArtikelModal,
    redigerarIndex,
    favoritArtikelVald,
    ursprungligFavoritId,
    artikelSparadSomFavorit,
    valtArtikel,
    showDeleteFavoritModal,
    deleteFavoritId,
    läggTillArtikel,
    startRedigeraArtikel,
    avbrytRedigering,
    taBortArtikel,
    setBeskrivning,
    setAntal,
    setPrisPerEnhet,
    setMoms,
    setValuta,
    setTyp,
    setRotRutArbete,
    setRotRutMaterial,
    updateArtikel,
    resetNyArtikel,
    setVisaArtikelModal,
    setValtArtikel,
  } = artikelContext;

  // Referens för resetNyArtikel som useFakturaData behöver
  useEffect(() => {
    if (fakturaData.resetNyArtikelRef) {
      fakturaData.resetNyArtikelRef.current = resetNyArtikel;
    }
  }, [resetNyArtikel, fakturaData.resetNyArtikelRef]);

  const produkterTjansterState = useMemo(
    () => ({
      favoritArtiklar,
      showFavoritArtiklar,
      blinkIndex,
      visaRotRutForm,
      visaArtikelForm,
      visaArtikelModal,
      redigerarIndex,
      favoritArtikelVald,
      ursprungligFavoritId,
      artikelSparadSomFavorit,
      valtArtikel,
      showDeleteFavoritModal,
      deleteFavoritId,
    }),
    [
      favoritArtiklar,
      showFavoritArtiklar,
      blinkIndex,
      visaRotRutForm,
      visaArtikelForm,
      visaArtikelModal,
      redigerarIndex,
      favoritArtikelVald,
      ursprungligFavoritId,
      artikelSparadSomFavorit,
      valtArtikel,
      showDeleteFavoritModal,
      deleteFavoritId,
    ]
  );

  // Local UI state
  const [showPreview, setShowPreview] = useState(false);

  // Preview functions
  const openPreview = useCallback(() => setShowPreview(true), []);
  const closePreview = useCallback(() => setShowPreview(false), []);

  // Helper functions
  const updateFormField = useCallback(
    (field: keyof FakturaFormData, value: string | number | boolean | unknown) => {
      setFormData({ [field]: value });
    },
    [setFormData]
  );

  const updateMultipleFields = useCallback(
    (updates: Partial<FakturaFormData>) => {
      setFormData(updates);
    },
    [setFormData]
  );

  // Toast helpers
  const showSuccess = useCallback((message: string) => {
    showToast(message, "success");
  }, []);

  const showError = useCallback((message: string) => {
    showToast(message, "error");
  }, []);

  const showInfo = useCallback((message: string) => {
    showToast(message, "info");
  }, []);

  // Registrera svensk locale för datepicker
  useEffect(() => {
    registerLocale("sv", sv);
  }, []);

  // =============================================================================
  // RETURN OBJECT
  // =============================================================================

  return {
    // State
    formData,
    kundStatus,
    nyArtikel,
    produkterTjansterState,
    userSettings,
    navigationState,
    showPreview,
    kunder: kundUppgifter.kunder,
    showDeleteKundModal: kundUppgifter.showDeleteKundModal,
    setShowDeleteKundModal: kundUppgifter.setShowDeleteKundModal,
    editFakturaId: fakturaData.editFakturaId,
    isEditingView: fakturaData.isEditingView,
    fakturaTitle: fakturaData.fakturaTitle,

    // Context actions
    setFormData,
    resetFormData,
    setKundStatus,
    resetKund,
    resetNyArtikel,
    setBokföringsmetod,

    // Helper functions
    updateFormField,
    updateMultipleFields,
    updateArtikel,
    showSuccess,
    showError,
    showInfo,

    // Data loading functions (från useFakturaData)
    laddaFakturaData: fakturaData.laddaFakturaData,
    laddaFakturaDataMedLoading: fakturaData.laddaFakturaDataMedLoading,

    // UI helper functions
    openPreview,
    closePreview,
    isLoadingFaktura: fakturaData.isLoadingFaktura,

    // Local state setters
    setShowPreview,

    // Artikel setters för nyArtikel state
    setBeskrivning,
    setAntal,
    setPrisPerEnhet,
    setMoms,
    setValuta,
    setTyp,
    setRotRutArbete,
    setRotRutMaterial,

    // Betalning functions (från useBetalning)
    addDays: betalning.addDays,
    updatePaymentDates: betalning.updatePaymentDates,
    hanteraÄndraDatum: betalning.hanteraÄndraDatum,
    hanteraÄndradText: betalning.hanteraÄndradText,
    hanteraÄndradDropdown: betalning.hanteraÄndradDropdown,
    fakturadatumDate: betalning.fakturadatumDate,
    forfalloDate: betalning.forfalloDate,

    // Avsändare functions (från useAvsandare)
    loadForetagsprofil: avsandare.loadForetagsprofil,
    sparaForetagsprofil: avsandare.sparaForetagsprofil,
    handleLogoUpload: avsandare.handleLogoUpload,
    hanteraLoggaUpload: avsandare.hanteraLoggaUpload,
    hanteraTangentNer: avsandare.hanteraTangentNer,

    // Kund functions (från useKundUppgifter)
    validateKundData: kundUppgifter.validateKundData,
    sanitizeKundFormData: kundUppgifter.sanitizeKundFormData,
    sparaNyKundData: kundUppgifter.sparaNyKundData,
    handleKundChange: kundUppgifter.handleKundChange,
    handleKundSave: kundUppgifter.handleKundSave,
    handleSelectCustomer: kundUppgifter.handleSelectCustomer,
    handleCreateNewCustomer: kundUppgifter.handleCreateNewCustomer,
    handleDeleteCustomer: kundUppgifter.handleDeleteCustomer,
    confirmDeleteKund: kundUppgifter.confirmDeleteKund,
    handleEditCustomer: kundUppgifter.handleEditCustomer,

    // Basic artikel functions (för bakåtkompatibilitet)
    läggTillArtikel,
    startRedigeraArtikel,
    avbrytRedigering,
    taBortArtikel,
    setVisaArtikelModal,
    setValtArtikel,

    // Refs
    fileInputRef: avsandare.fileInputRef,
  };
}
