import { useMemo } from "react";
import type { Lönekörning } from "../types/types";

export type WizardStepStatus = "disabled" | "available" | "completed";

export interface WizardStep {
  id: string;
  title: string;
  description: string;
  buttonText: string;
  completed: boolean;
  enabled: boolean;
  status: WizardStepStatus;
  issues: string[];
  onClick: () => void;
}

export interface UseWizardProps {
  lönekörning: Lönekörning | null;
  onMaila: () => void;
  onBokför: () => void;
  onGenereraAGI: () => void;
  onBokförSkatter: () => void;
}

export function useWizard({
  lönekörning,
  onMaila,
  onBokför,
  onGenereraAGI,
  onBokförSkatter,
}: UseWizardProps) {
  // Hämta aktivt steg från databasen (default 1 om inte satt)
  const aktivtSteg = lönekörning?.aktivt_steg || 1;

  // Beräkna steg-status
  const steps: WizardStep[] = useMemo(
    () => [
      {
        id: "maila",
        title: "Maila",
        description: "Skicka lönespecar",
        buttonText: "✉️ Maila lönespecar",
        completed: aktivtSteg > 1, // Färdigt om vi gått till steg 2+
        enabled: aktivtSteg >= 1,
        status: aktivtSteg > 1 ? "completed" : aktivtSteg >= 1 ? "available" : "disabled",
        issues: [],
        onClick: onMaila,
      },
      {
        id: "agi",
        title: "AGI",
        description: "Generera deklaration",
        buttonText: "� Generera AGI",
        completed: aktivtSteg > 2, // Färdigt om vi gått till steg 3+
        enabled: aktivtSteg >= 2,
        status: aktivtSteg > 2 ? "completed" : aktivtSteg >= 2 ? "available" : "disabled",
        issues: [],
        onClick: onGenereraAGI,
      },
      {
        id: "bokfor",
        title: "Bokför",
        description: "Registrera i bokföring",
        buttonText: "� Bokför",
        completed: aktivtSteg > 3, // Färdigt om vi gått till steg 4+
        enabled: aktivtSteg >= 3,
        status: aktivtSteg > 3 ? "completed" : aktivtSteg >= 3 ? "available" : "disabled",
        issues: [],
        onClick: onBokför,
      },
      {
        id: "skatter",
        title: "Skatter",
        description: "Bokför skatter",
        buttonText: "💰 Bokför skatter",
        completed: aktivtSteg > 4, // Färdigt om lönekörningen är helt klar
        enabled: aktivtSteg >= 4,
        status: aktivtSteg > 4 ? "completed" : aktivtSteg >= 4 ? "available" : "disabled",
        issues: [],
        onClick: onBokförSkatter,
      },
    ],
    [aktivtSteg, onMaila, onBokför, onGenereraAGI, onBokförSkatter]
  );

  // Progress
  const progress = useMemo(() => {
    const completedSteps = steps.filter((step) => step.completed).length;
    const totalSteps = steps.length;
    return {
      completed: completedSteps,
      total: totalSteps,
      percentage: totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0,
    };
  }, [steps]);

  const isComplete = progress.completed === progress.total;
  const currentStep = steps.find((step) => step.status === "available");
  const allIssues = steps.flatMap((step) => step.issues);

  return {
    steps,
    progress,
    isComplete,
    currentStep,
    allIssues,
    hasIssues: allIssues.length > 0,
  };
}
