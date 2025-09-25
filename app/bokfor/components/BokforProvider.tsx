"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useBokfor } from "../hooks/useBokfor";
import { BokforContextType, BokforProviderProps } from "../types/types";

const BokforContext = createContext<BokforContextType | null>(null);

export function BokforProvider({ children }: BokforProviderProps) {
  const bokforData = useBokfor();

  // Gruppera data i den gamla strukturen som komponenterna förväntar sig
  const contextValue = useMemo(
    () => ({
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
        setAnställda: bokforData.setAnstallda, // Alias för bakåtkompatibilitet
        setAnstalldId: bokforData.setAnstalldId,
        showToast: bokforData.showToast,
        setKonto2890Beskrivning: bokforData.setKonto2890Beskrivning,
      },
      handlers: {
        resetAllFields: bokforData.resetAllFields,
        handleNewBokforing: bokforData.resetAllFields, // Alias för "Bokför något nytt" knappen
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
        useInformationHelper: () => ({
          belopp: bokforData.belopp,
          handleBeloppChange: bokforData.handleBeloppChange,
          handleTransaktionsdatumChange: bokforData.handleTransaktionsdatumChange,
          transaktionsdatumDate: bokforData.transaktionsdatumDate,
        }),
        useKommentarHelper: (props?: {
          kommentar?: string;
          setKommentar?: (value: string) => void;
        }) => ({
          kommentar: props?.kommentar ?? bokforData.kommentar,
          handleChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            const value = e.target.value;
            if (props?.setKommentar) {
              props.setKommentar(value);
            } else {
              bokforData.setKommentar(value);
            }
          },
        }),
        useForhandsgranskningHelper: (props: { fil?: File | null; pdfUrl?: string | null }) => {
          const [showModal, setShowModal] = React.useState(false);
          const hasFile = !!(props.fil || props.pdfUrl);
          const blobUrl = props.fil ? URL.createObjectURL(props.fil) : props.pdfUrl;

          return {
            state: {
              hasFile,
              blobUrl,
              showModal,
            },
            actions: {},
            handlers: {
              handlePdfOpenClick: () => {
                if (blobUrl) {
                  window.open(blobUrl, "_blank");
                }
              },
              handleFileClick: () => {
                setShowModal(!showModal);
              },
              getButtonText: () => {
                return showModal ? "Stäng förhandsgranskning" : "Förhandsgranskning";
              },
            },
          };
        },
        useStandardLayoutHelper: (onSubmit: () => void, title: string) => {
          const isValid = !!(bokforData.belopp && bokforData.transaktionsdatum);

          return {
            state: {
              belopp: bokforData.belopp,
              transaktionsdatum: bokforData.transaktionsdatum,
              kommentar: bokforData.kommentar,
              fil: bokforData.fil,
              pdfUrl: bokforData.pdfUrl,
              isValid,
              title,
            },
            handlers: {
              setBelopp: bokforData.setBelopp,
              setTransaktionsdatum: bokforData.setTransaktionsdatum,
              setKommentar: bokforData.setKommentar,
              setFil: bokforData.setFil,
              setPdfUrl: bokforData.setPdfUrl,
              setCurrentStep: bokforData.setCurrentStep,
              onSubmit,
            },
          };
        },
      },
      // Utility functions for ForvalKort
      getCardClassName: (isHighlighted: boolean) => {
        return `cursor-pointer p-6 mb-4 border-2 border-dashed rounded-lg transition-all duration-200 ${
          isHighlighted
            ? "border-blue-400 bg-blue-950/30 shadow-lg shadow-blue-500/20"
            : "border-gray-600 bg-slate-800/50 hover:border-gray-500 hover:bg-slate-800/70"
        }`;
      },
      formatKontoValue: (value: number | boolean | null | undefined) => {
        if (!value || value === true) return "-";
        if (typeof value === "number") return value.toLocaleString("sv-SE");
        return "-";
      },
    }),
    [bokforData]
  );

  return <BokforContext.Provider value={contextValue}>{children}</BokforContext.Provider>;
}

export function useBokforContext(): BokforContextType {
  const context = useContext(BokforContext);
  if (!context) {
    throw new Error("useBokforContext must be used within a BokforProvider");
  }
  return context;
}
