"use client";

import { useState, useEffect } from "react";
import type {
  ImportWizardProps,
  WizardStep,
  LocalImportSettings,
  ImportResultatWizard,
} from "../types/types";
import StegKontohantering from "./StegKontohantering";
import Steg1Installningar from "./Steg1Installningar";
import Steg2Forhandsvisning from "./Steg2Forhandsvisning";
import Steg3Import from "./Steg3Import";
import Steg4Resultat from "./Steg4Resultat";

export default function ImportWizard({
  sieData,
  saknadeKonton,
  analys,
  onCancel,
  selectedFile,
}: ImportWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>("konton");
  const [importResultat, setImportResultat] = useState<ImportResultatWizard | null>(null);
  const [importSettings, setImportSettings] = useState<LocalImportSettings>({
    startDatum: "",
    slutDatum: "",
    inkluderaVerifikationer: true,
    inkluderaBalanser: true,
    inkluderaResultat: true,
    skapaKonton: true,
    exkluderaVerifikationer: [] as string[], // Array av verifikationsnummer att skippa
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

      // Konvertera från YYYYMMDD till YYYY-MM-DD format
      const formatDatum = (datum: string) => {
        if (datum.length === 8) {
          return `${datum.slice(0, 4)}-${datum.slice(4, 6)}-${datum.slice(6, 8)}`;
        }
        return datum;
      };

      setImportSettings((prev) => ({
        ...prev,
        startDatum: formatDatum(tidigasteDatum),
        slutDatum: formatDatum(senasteDatum),
      }));
    }
  }, [sieData, importSettings.startDatum]);

  const steps = [
    { id: "konton", title: "Kontohantering", description: "Granska och skapa saknade konton" },
    {
      id: "inställningar",
      title: "Importinställningar",
      description: "Välj vad som ska importeras",
    },
    {
      id: "förhandsvisning",
      title: "Förhandsvisning",
      description: "Kontrollera vad som kommer att hända",
    },
    { id: "import", title: "Importera", description: "Utför importen" },
    { id: "resultat", title: "Resultat", description: "Import slutförd" },
  ];

  const currentStepIndex = steps.findIndex((step) => step.id === currentStep);

  return (
    <div className="min-h-screen bg-slate-800 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-slate-700 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">SIE Import-wizard</h1>
            <button onClick={onCancel} className="text-gray-400 hover:text-white transition-colors">
              ✕ Avbryt
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center space-x-4 mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-8 h-8 min-w-[2rem] rounded-full flex items-center justify-center text-sm font-bold ${
                    index < currentStepIndex
                      ? "bg-green-600 text-white"
                      : index === currentStepIndex
                        ? "bg-cyan-600 text-white"
                        : "bg-slate-600 text-gray-400"
                  }`}
                >
                  {index < currentStepIndex ? "✓" : index + 1}
                </div>
                <div className="ml-2">
                  <div
                    className={`text-sm font-medium ${
                      index <= currentStepIndex ? "text-white" : "text-gray-400"
                    }`}
                  >
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-500">{step.description}</div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-8 h-0.5 mx-4 ${
                      index < currentStepIndex ? "bg-green-600" : "bg-slate-600"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-slate-700 rounded-lg p-6">
          {currentStep === "konton" && (
            <StegKontohantering
              sieData={sieData}
              saknadeKonton={saknadeKonton}
              analys={analys}
              onNext={() => setCurrentStep("inställningar")}
            />
          )}

          {currentStep === "inställningar" && (
            <Steg1Installningar
              sieData={sieData}
              settings={importSettings}
              onSettingsChange={setImportSettings}
              onNext={() => setCurrentStep("förhandsvisning")}
              onBack={() => setCurrentStep("konton")}
            />
          )}

          {currentStep === "förhandsvisning" && (
            <Steg2Forhandsvisning
              sieData={sieData}
              settings={importSettings}
              onNext={() => setCurrentStep("import")}
              onBack={() => setCurrentStep("inställningar")}
            />
          )}

          {currentStep === "import" && (
            <Steg3Import
              sieData={sieData}
              saknadeKonton={saknadeKonton}
              settings={importSettings}
              selectedFile={selectedFile}
              onComplete={(resultat) => {
                setImportResultat(resultat);
                setCurrentStep("resultat");
              }}
            />
          )}

          {currentStep === "resultat" && (
            <Steg4Resultat resultat={importResultat} onFinish={onCancel} />
          )}
        </div>
      </div>
    </div>
  );
}
