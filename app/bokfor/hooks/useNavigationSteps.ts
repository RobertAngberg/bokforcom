"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface UseNavigationStepsProps {
  // State setters for resetting fields
  setKontonummer: (value: string) => void;
  setKontobeskrivning: (value: string | null) => void;
  setBelopp: (value: number | null) => void;
  setKommentar: (value: string | null) => void;
  setFil: (value: File | null) => void;
  setPdfUrl: (value: string | null) => void;
  setTransaktionsdatum: (value: string | null) => void;
  setValtFörval: (value: any) => void;
  setExtrafält: (value: Record<string, any>) => void;
  setLeverantör: (value: any) => void;
  setFakturanummer: (value: string | null) => void;
  setFakturadatum: (value: string | null) => void;
  setFörfallodatum: (value: string | null) => void;
  setBetaldatum: (value: string | null) => void;
  setBokförSomFaktura: (value: boolean) => void;
  setKundfakturadatum: (value: string | null) => void;
  setLevfaktMode: (value: boolean) => void;
  setUtlaggMode: (value: boolean) => void;
}

export function useNavigationSteps({
  setKontonummer,
  setKontobeskrivning,
  setBelopp,
  setKommentar,
  setFil,
  setPdfUrl,
  setTransaktionsdatum,
  setValtFörval,
  setExtrafält,
  setLeverantör,
  setFakturanummer,
  setFakturadatum,
  setFörfallodatum,
  setBetaldatum,
  setBokförSomFaktura,
  setKundfakturadatum,
  setLevfaktMode,
  setUtlaggMode,
}: UseNavigationStepsProps) {
  // ====================================================
  // NAVIGATION STATE
  // ====================================================
  const [currentStep, setCurrentStep] = useState(1);

  // ====================================================
  // NEXT.JS NAVIGATION HOOKS
  // ====================================================
  const searchParams = useSearchParams();
  const router = useRouter();

  // ====================================================
  // URL PARAMETER HANDLING
  // ====================================================

  // Läs URL-parametrar och sätt state vid mount
  useEffect(() => {
    const isUtlagg = searchParams.get("utlagg") === "true";
    const isLevfakt = searchParams.get("levfakt") === "true";

    if (isUtlagg) {
      setUtlaggMode(true);
    }
    if (isLevfakt) {
      setLevfaktMode(true);
    }
  }, [searchParams, setUtlaggMode, setLevfaktMode]);

  // ====================================================
  // RESET AND EXIT FUNCTIONS
  // ====================================================

  const resetAllFields = useCallback(() => {
    setCurrentStep(1);
    setKontonummer("");
    setKontobeskrivning(null);
    setBelopp(null);
    setKommentar(null);
    setFil(null);
    setPdfUrl(null);
    setTransaktionsdatum(null);
    setValtFörval(null);
    setExtrafält({});
    setLeverantör(null);
    setFakturanummer(null);
    setFakturadatum(null);
    setFörfallodatum(null);
    setBetaldatum(null);
    setBokförSomFaktura(false);
    setKundfakturadatum(null);
    setLevfaktMode(false);
    setUtlaggMode(false);
  }, [
    setKontonummer,
    setKontobeskrivning,
    setBelopp,
    setKommentar,
    setFil,
    setPdfUrl,
    setTransaktionsdatum,
    setValtFörval,
    setExtrafält,
    setLeverantör,
    setFakturanummer,
    setFakturadatum,
    setFörfallodatum,
    setBetaldatum,
    setBokförSomFaktura,
    setKundfakturadatum,
    setLevfaktMode,
    setUtlaggMode,
  ]);

  const exitLevfaktMode = useCallback(
    (routerInstance?: any) => {
      setLevfaktMode(false);
      setCurrentStep(1);

      // Rensa leverantörsfaktura-specifika fält
      setLeverantör(null);
      setFakturanummer(null);
      setFakturadatum(null);
      setFörfallodatum(null);
      setBetaldatum(null);
      setBokförSomFaktura(false);

      // Navigera till standard bokföring utan URL-parametrar
      if (routerInstance) {
        routerInstance.push("/bokfor");
      } else if (router) {
        router.push("/bokfor");
      }
    },
    [
      router,
      setLevfaktMode,
      setLeverantör,
      setFakturanummer,
      setFakturadatum,
      setFörfallodatum,
      setBetaldatum,
      setBokförSomFaktura,
    ]
  );

  // ====================================================
  // STEP NAVIGATION HELPERS
  // ====================================================

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= 4) {
      setCurrentStep(step);
    }
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((current) => Math.min(current + 1, 4));
  }, []);

  const previousStep = useCallback(() => {
    setCurrentStep((current) => Math.max(current - 1, 1));
  }, []);

  const goToFirstStep = useCallback(() => {
    setCurrentStep(1);
  }, []);

  const goToSecondStep = useCallback(() => {
    setCurrentStep(2);
  }, []);

  const goToThirdStep = useCallback(() => {
    setCurrentStep(3);
  }, []);

  const goToFinalStep = useCallback(() => {
    setCurrentStep(4);
  }, []);

  // ====================================================
  // COMPUTED VALUES
  // ====================================================

  const isFirstStep = currentStep === 1;
  const isSecondStep = currentStep === 2;
  const isThirdStep = currentStep === 3;
  const isFinalStep = currentStep === 4;
  const canGoNext = currentStep < 4;
  const canGoPrevious = currentStep > 1;

  // ====================================================
  // RETURN INTERFACE
  // ====================================================

  return {
    // Current State
    currentStep,
    isFirstStep,
    isSecondStep,
    isThirdStep,
    isFinalStep,
    canGoNext,
    canGoPrevious,

    // Navigation Control
    setCurrentStep,
    goToStep,
    nextStep,
    previousStep,
    goToFirstStep,
    goToSecondStep,
    goToThirdStep,
    goToFinalStep,

    // Reset & Exit
    resetAllFields,
    exitLevfaktMode,

    // Next.js Router Access
    router,
    searchParams,
  };
}
