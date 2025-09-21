"use client";

import { createContext, useContext } from "react";
import { useBokfor } from "../hooks/useBokfor";
import { BokforContextType, BokforProviderProps } from "../types/types";

const BokforContext = createContext<BokforContextType | null>(null);

export function BokforProvider({ children }: BokforProviderProps) {
  const bokforData = useBokfor();

  // Gruppera data i den gamla strukturen som komponenterna förväntar sig
  const contextValue = {
    state: {
      currentStep: bokforData.currentStep,
      favoritFörval: bokforData.favoritFörval,
      allaFörval: bokforData.allaFörval,
      anställda: bokforData.anställda,
      bokföringsmetod: bokforData.bokföringsmetod,
      levfaktMode: bokforData.levfaktMode,
      utlaggMode: bokforData.utlaggMode,
      kontonummer: bokforData.kontonummer,
      kontobeskrivning: bokforData.kontobeskrivning,
      belopp: bokforData.belopp,
      kommentar: bokforData.kommentar,
      fil: bokforData.fil,
      pdfUrl: bokforData.pdfUrl,
      transaktionsdatum: bokforData.transaktionsdatum,
      valtFörval: bokforData.valtFörval,
      extrafält: bokforData.extrafält,
      leverantör: bokforData.leverantör,
      fakturanummer: bokforData.fakturanummer,
      fakturadatum: bokforData.fakturadatum,
      förfallodatum: bokforData.förfallodatum,
      betaldatum: bokforData.betaldatum,
      bokförSomFaktura: bokforData.bokförSomFaktura,
      kundfakturadatum: bokforData.kundfakturadatum,
      ocrText: bokforData.ocrText,
      visaLeverantorModal: bokforData.visaLeverantorModal,
      anstallda: bokforData.anstallda,
      anstalldId: bokforData.anstalldId,
      loadingSteg3: bokforData.loadingSteg3,
      toast: bokforData.toast,
      konto2890Beskrivning: bokforData.konto2890Beskrivning,
      safeBelopp: bokforData.safeBelopp,
      safeKommentar: bokforData.safeKommentar,
      safeTransaktionsdatum: bokforData.safeTransaktionsdatum,
      momsSats: bokforData.momsSats,
      moms: bokforData.moms,
      beloppUtanMoms: bokforData.beloppUtanMoms,
      ärFörsäljning: bokforData.ärFörsäljning,
      fallbackRows: bokforData.fallbackRows,
      searchText: bokforData.searchText,
      results: bokforData.results,
      highlightedIndex: bokforData.highlightedIndex,
      loading: bokforData.loading,
    },
    actions: {
      setBokföringsmetod: bokforData.setBokföringsmetod,
      setLevfaktMode: bokforData.setLevfaktMode,
      setUtlaggMode: bokforData.setUtlaggMode,
      setKontonummer: bokforData.setKontonummer,
      setKontobeskrivning: bokforData.setKontobeskrivning,
      setBelopp: bokforData.setBelopp,
      setKommentar: bokforData.setKommentar,
      setFil: bokforData.setFil,
      setPdfUrl: bokforData.setPdfUrl,
      setTransaktionsdatum: bokforData.setTransaktionsdatum,
      setValtFörval: bokforData.setValtFörval,
      setExtrafält: bokforData.setExtrafält,
      setLeverantör: bokforData.setLeverantör,
      setFakturanummer: bokforData.setFakturanummer,
      setFakturadatum: bokforData.setFakturadatum,
      setCurrentStep: bokforData.setCurrentStep,
      setFavoritFörvalen: bokforData.setFavoritFörvalen,
      setAllaFörval: bokforData.setAllaFörval,
      setAnstallda: bokforData.setAnstallda,
      setAnstalldId: bokforData.setAnstalldId,
      showToast: bokforData.showToast,
      hideToast: bokforData.hideToast,
      setKonto2890Beskrivning: bokforData.setKonto2890Beskrivning,
    },
    handlers: {
      resetAllFields: bokforData.resetAllFields,
      exitLevfaktMode: bokforData.exitLevfaktMode,
      goToStep: bokforData.goToStep,
      nextStep: bokforData.nextStep,
      previousStep: bokforData.previousStep,
      handleOcrTextChange: bokforData.handleOcrTextChange,
      handleReprocessTrigger: bokforData.handleReprocessTrigger,
      handleCheckboxChange: bokforData.handleCheckboxChange,
      uploadFileToBlob: bokforData.uploadFileToBlob,
      extractDataFromOCRKund: bokforData.extractDataFromOCRKund,
      extractDataFromOCRGeneral: bokforData.extractDataFromOCRGeneral,
      extractDataFromOCRLeverantorsfaktura: bokforData.extractDataFromOCRLeverantorsfaktura,
      handleLeverantorCheckboxChange: bokforData.handleLeverantorCheckboxChange,
      handleLeverantorRemove: bokforData.handleLeverantorRemove,
      handleLeverantorSelected: bokforData.handleLeverantorSelected,
      handleLeverantorModalClose: bokforData.handleLeverantorModalClose,
      handleSearchChange: bokforData.handleSearchChange,
      handleKeyDown: bokforData.handleKeyDown,
      väljFörval: bokforData.väljFörval,
      clearSearch: bokforData.clearSearch,
      getTitle: bokforData.getTitle,
      calculateBelopp: bokforData.calculateBelopp,
      transformKontonummer: bokforData.transformKontonummer,
      beräknaTransaktionsposter: bokforData.beräknaTransaktionsposter,
      handleSubmit: bokforData.handleSubmit,
      handleButtonClick: bokforData.handleButtonClick,
      handleBeloppChange: bokforData.handleBeloppChange,
      handleTransaktionsdatumChange: bokforData.handleTransaktionsdatumChange,
      handleFakturadatumChange: bokforData.handleFakturadatumChange,
      isFormValid: bokforData.isFormValid,
      beloppError: bokforData.beloppError,
      datumError: bokforData.datumError,
      transaktionsdatumDate: bokforData.transaktionsdatumDate,
      fakturadatumDate: bokforData.fakturadatumDate,
      förfallodatumDate: bokforData.förfallodatumDate,
      betaldatumDate: bokforData.betaldatumDate,
      useSteg2LevfaktHelper: () => ({
        state: {
          fakturanummer: bokforData.fakturanummer,
          fakturadatum: bokforData.fakturadatum,
          förfallodatum: bokforData.förfallodatum,
        },
        actions: {
          setFakturanummer: bokforData.setFakturanummer,
          setFakturadatum: bokforData.setFakturadatum,
          setFörfallodatum: bokforData.setFörfallodatum,
        },
        handlers: {
          exitLevfaktMode: bokforData.exitLevfaktMode,
        },
      }),
    },
  };

  return <BokforContext.Provider value={contextValue}>{children}</BokforContext.Provider>;
}

export function useBokforContext(): BokforContextType {
  const context = useContext(BokforContext);
  if (!context) {
    throw new Error("useBokforContext must be used within a BokforProvider");
  }
  return context;
}
