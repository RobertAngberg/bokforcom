/**
 * Hook för Import Wizard state management
 *
 * Hanterar:
 * - Wizard step navigation
 * - Import settings
 * - Auto-fyll datum från SIE-data
 * - Import resultat
 */

"use client";

import { useState, useEffect } from "react";
import { formatSieDateToHtml } from "../utils/formatting";
import type {
  WizardStep,
  LocalImportSettings,
  ImportResultatWizard,
  SieData,
} from "../types/types";

export function useImportWizard(sieData: SieData) {
  const [currentStep, setCurrentStep] = useState<WizardStep>("inställningar");
  const [importResultat, setImportResultat] = useState<ImportResultatWizard | null>(null);
  const [importSettings, setImportSettings] = useState<LocalImportSettings>({
    startDatum: "",
    slutDatum: "",
    inkluderaVerifikationer: true,
    inkluderaBalanser: true,
    inkluderaResultat: true,
    skapaKonton: true,
    exkluderaVerifikationer: [] as string[],
  });

  // Förfyll datumen automatiskt baserat på SIE-data
  useEffect(() => {
    if (sieData.verifikationer.length > 0 && !importSettings.startDatum) {
      const tidigasteDatum = sieData.verifikationer.reduce(
        (earliest, v) => (v.datum < earliest ? v.datum : earliest),
        sieData.verifikationer[0].datum
      );
      const senasteDatum = sieData.verifikationer.reduce(
        (latest, v) => (v.datum > latest ? v.datum : latest),
        sieData.verifikationer[0].datum
      );

      setImportSettings((prev) => ({
        ...prev,
        startDatum: formatSieDateToHtml(tidigasteDatum),
        slutDatum: formatSieDateToHtml(senasteDatum),
      }));
    }
  }, [sieData, importSettings.startDatum]);

  // Navigation helpers
  const goToNext = () => {
    const steps: WizardStep[] = ["inställningar", "förhandsvisning", "import", "resultat"];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const goToBack = () => {
    const steps: WizardStep[] = ["inställningar", "förhandsvisning", "import", "resultat"];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const goToStep = (step: WizardStep) => {
    setCurrentStep(step);
  };

  const resetWizard = () => {
    setCurrentStep("inställningar");
    setImportResultat(null);
  };

  return {
    currentStep,
    importResultat,
    importSettings,
    setImportSettings,
    setImportResultat,
    goToNext,
    goToBack,
    goToStep,
    setCurrentStep,
    resetWizard,
  };
}
