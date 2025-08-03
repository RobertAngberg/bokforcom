"use client";

import { useState, useEffect } from "react";
import Knapp from "../_components/Knapp";
import KnappFullWidth from "../_components/KnappFullWidth";
import { skapaKonton, importeraSieData } from "./actions";

interface SieData {
  header: {
    program: string;
    organisationsnummer: string;
    företagsnamn: string;
    räkenskapsår: Array<{ år: number; startdatum: string; slutdatum: string }>;
    kontoplan: string;
  };
  konton: Array<{
    nummer: string;
    namn: string;
  }>;
  verifikationer: Array<{
    serie: string;
    nummer: string;
    datum: string;
    beskrivning: string;
    transaktioner: Array<{
      konto: string;
      belopp: number;
    }>;
  }>;
  balanser: {
    ingående: Array<{ konto: string; belopp: number }>;
    utgående: Array<{ konto: string; belopp: number }>;
  };
  resultat: Array<{ konto: string; belopp: number }>;
}

interface Analys {
  totaltAntal: number;
  standardKonton: number;
  specialKonton: number;
  kritiskaKonton: string[];
  anvandaSaknade: number;
  totaltAnvanda: number;
}

interface ImportWizardProps {
  sieData: SieData;
  saknadeKonton: string[];
  analys: Analys;
  onCancel: () => void;
  selectedFile?: File | null;
}

type WizardStep = "konton" | "inställningar" | "förhandsvisning" | "import" | "resultat";

export default function ImportWizard({
  sieData,
  saknadeKonton,
  analys,
  onCancel,
  selectedFile,
}: ImportWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>("konton");
  const [importResultat, setImportResultat] = useState<any>(null);
  const [importSettings, setImportSettings] = useState({
    startDatum: "",
    slutDatum: "",
    inkluderaVerifikationer: true,
    inkluderaBalanser: true,
    inkluderaResultat: true,
    skapaKonton: true,
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency: "SEK",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("sv-SE");
  };

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
            <KontoSteg
              sieData={sieData}
              saknadeKonton={saknadeKonton}
              analys={analys}
              onNext={() => setCurrentStep("inställningar")}
            />
          )}

          {currentStep === "inställningar" && (
            <InställningarSteg
              sieData={sieData}
              settings={importSettings}
              onSettingsChange={setImportSettings}
              onNext={() => setCurrentStep("förhandsvisning")}
              onBack={() => setCurrentStep("konton")}
            />
          )}

          {currentStep === "förhandsvisning" && (
            <FörhandsvisningSteg
              sieData={sieData}
              settings={importSettings}
              onNext={() => setCurrentStep("import")}
              onBack={() => setCurrentStep("inställningar")}
            />
          )}

          {currentStep === "import" && (
            <ImportSteg
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
            <ResultatSteg resultat={importResultat} onFinish={onCancel} />
          )}
        </div>
      </div>
    </div>
  );
}

// Komponent för Steg 1: Kontohantering
function KontoSteg({
  sieData,
  saknadeKonton,
  analys,
  onNext,
}: {
  sieData: SieData;
  saknadeKonton: string[];
  analys: Analys;
  onNext: () => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-4">Steg 1: Kontohantering</h2>

      <div className="space-y-4">
        {/* Info om automatisk kontoskapande */}
        <div className="bg-blue-500/20 border border-blue-500 text-blue-400 px-4 py-3 rounded">
          <strong>ℹ️ Smart kontoskapande:</strong> Systemet kommer automatiskt att skapa ALLA
          använda konton som saknas i din kontoplan, inklusive både BAS-standardkonton och
          företagsspecifika konton.
        </div>

        {saknadeKonton.length > 0 ? (
          <div className="space-y-4">
            <div className="bg-yellow-500/20 border border-yellow-500 text-yellow-400 px-4 py-3 rounded">
              <strong>⚠️ Specialkonton att granska:</strong> {saknadeKonton.length}{" "}
              företagsspecifika konton hittades som bör granskas innan import.
            </div>

            <div className="bg-slate-800 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-3">
                Företagsspecifika konton som kommer att skapas:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {saknadeKonton.map((kontonummer) => {
                  const kontoInfo = sieData.konton.find((k) => k.nummer === kontonummer);
                  return (
                    <div key={kontonummer} className="bg-slate-700 rounded-lg p-3">
                      <div className="text-lg font-bold text-white">{kontonummer}</div>
                      {kontoInfo && (
                        <div className="text-gray-300 text-sm mt-1">{kontoInfo.namn}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-green-500/20 border border-green-500 text-green-400 px-4 py-3 rounded">
            ✅ Inga företagsspecifika konton behöver granskas!
          </div>
        )}

        {/* Info om övriga konton */}
        {analys.anvandaSaknade > saknadeKonton.length && (
          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="font-semibold text-white mb-2">📊 Ytterligare kontoskapande</h3>
            <p className="text-gray-300 text-sm">
              Totalt kommer {analys.anvandaSaknade} använda konton att skapas, varav{" "}
              {analys.anvandaSaknade - saknadeKonton.length} är BAS-standardkonton som skapas
              automatiskt utan granskning.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <Knapp text="Fortsätt till inställningar →" onClick={onNext} />
      </div>
    </div>
  );
}

// Komponent för Steg 2: Inställningar
function InställningarSteg({
  sieData,
  settings,
  onSettingsChange,
  onNext,
  onBack,
}: {
  sieData: SieData;
  settings: any;
  onSettingsChange: (settings: any) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const tidigasteDatum =
    sieData.verifikationer.length > 0
      ? sieData.verifikationer.reduce(
          (earliest, v) => (v.datum < earliest ? v.datum : earliest),
          sieData.verifikationer[0].datum
        )
      : "";

  const senasteDatum =
    sieData.verifikationer.length > 0
      ? sieData.verifikationer.reduce(
          (latest, v) => (v.datum > latest ? v.datum : latest),
          sieData.verifikationer[0].datum
        )
      : "";

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-4">Steg 2: Importinställningar</h2>

      <div className="space-y-6">
        {/* Datumintervall */}
        <div className="bg-slate-800 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-3">Datumintervall</h3>
          <div className="bg-blue-500/20 border border-blue-500 text-blue-400 px-4 py-3 rounded mb-3">
            <strong>
              📅 SIE-filen innehåller data från {tidigasteDatum} till {senasteDatum}
            </strong>
            <br />
            <span className="text-sm">
              Datumintervallet nedan är automatiskt förifyllt, men du kan justera det om du bara
              vill importera en del av perioden.
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Från datum</label>
              <input
                type="date"
                value={settings.startDatum}
                onChange={(e) => onSettingsChange({ ...settings, startDatum: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Till datum</label>
              <input
                type="date"
                value={settings.slutDatum}
                onChange={(e) => onSettingsChange({ ...settings, slutDatum: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Vad som ska importeras */}
        <div className="bg-slate-800 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-3">Vad ska importeras?</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.inkluderaVerifikationer}
                onChange={(e) =>
                  onSettingsChange({ ...settings, inkluderaVerifikationer: e.target.checked })
                }
                className="mr-3"
              />
              <span className="text-white">
                Verifikationer ({sieData.verifikationer.length} st)
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.inkluderaBalanser}
                onChange={(e) =>
                  onSettingsChange({ ...settings, inkluderaBalanser: e.target.checked })
                }
                className="mr-3"
              />
              <span className="text-white">Ingående/Utgående balanser</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.inkluderaResultat}
                onChange={(e) =>
                  onSettingsChange({ ...settings, inkluderaResultat: e.target.checked })
                }
                className="mr-3"
              />
              <span className="text-white">Resultatdata</span>
            </label>
          </div>
        </div>

        {/* Avancerade inställningar */}
        <div className="bg-slate-800 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-3">Avancerade inställningar</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.skapaKonton}
                onChange={(e) => onSettingsChange({ ...settings, skapaKonton: e.target.checked })}
                className="mr-3"
              />
              <span className="text-white">Skapa saknade konton automatiskt</span>
            </label>
            <div className="bg-blue-500/20 border border-blue-500 text-blue-400 px-3 py-2 rounded text-sm">
              <strong>🛡️ Duplicate-skydd:</strong> Importen avbryts automatiskt om befintliga
              verifikationer upptäcks för att förhindra dubbletter.
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <Knapp text="← Tillbaka" onClick={onBack} />
        <Knapp text="Fortsätt till förhandsvisning →" onClick={onNext} />
      </div>
    </div>
  );
}

// Komponent för Steg 3: Förhandsvisning
function FörhandsvisningSteg({
  sieData,
  settings,
  onNext,
  onBack,
}: {
  sieData: SieData;
  settings: any;
  onNext: () => void;
  onBack: () => void;
}) {
  // Filtrera verifikationer baserat på datumintervall
  const filtradeVerifikationer = sieData.verifikationer.filter((v) => {
    // Konvertera SIE-datum (YYYYMMDD) till HTML-datum (YYYY-MM-DD) för jämförelse
    const formatDatum = (datum: string) => {
      if (datum.length === 8) {
        return `${datum.slice(0, 4)}-${datum.slice(4, 6)}-${datum.slice(6, 8)}`;
      }
      return datum;
    };

    const verifikationsDatum = formatDatum(v.datum);

    if (settings.startDatum && verifikationsDatum < settings.startDatum) return false;
    if (settings.slutDatum && verifikationsDatum > settings.slutDatum) return false;
    return true;
  });

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-4">Steg 3: Förhandsvisning</h2>

      <div className="space-y-4">
        <div className="bg-blue-500/20 border border-blue-500 text-blue-400 px-4 py-3 rounded">
          <strong>📋 Sammanfattning:</strong> Följande kommer att importeras till din databas:
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {settings.inkluderaVerifikationer && (
            <div className="bg-slate-800 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-2">Verifikationer</h3>
              <div className="text-2xl font-bold text-cyan-400">
                {filtradeVerifikationer.length}
              </div>
              <div className="text-sm text-gray-400">verifikationer</div>
            </div>
          )}

          {settings.inkluderaBalanser && (
            <div className="bg-slate-800 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-2">Balanser</h3>
              <div className="text-2xl font-bold text-green-400">
                {sieData.balanser.ingående.length + sieData.balanser.utgående.length}
              </div>
              <div className="text-sm text-gray-400">balansposter</div>
            </div>
          )}

          {settings.inkluderaResultat && (
            <div className="bg-slate-800 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-2">Resultat</h3>
              <div className="text-2xl font-bold text-purple-400">{sieData.resultat.length}</div>
              <div className="text-sm text-gray-400">resultatposter</div>
            </div>
          )}
        </div>

        {settings.startDatum || settings.slutDatum ? (
          <div className="bg-yellow-500/20 border border-yellow-500 text-yellow-400 px-4 py-3 rounded">
            <strong>📅 Datumfilter:</strong>
            {settings.startDatum && ` Från ${settings.startDatum}`}
            {settings.slutDatum && ` Till ${settings.slutDatum}`}
          </div>
        ) : null}

        <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded">
          <strong>⚠️ Varning:</strong> Detta är en permanent åtgärd. Se till att du har en backup av
          din databas innan du fortsätter.
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <Knapp text="← Ändra inställningar" onClick={onBack} />
        <Knapp text="Starta import!" onClick={onNext} />
      </div>
    </div>
  );
}

// Komponent för Steg 4: Import
function ImportSteg({
  sieData,
  saknadeKonton,
  settings,
  selectedFile,
  onComplete,
}: {
  sieData: SieData;
  saknadeKonton: string[];
  settings: any;
  selectedFile?: File | null;
  onComplete: (resultat: any) => void;
}) {
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState("Förbereder import...");
  const [error, setError] = useState<string | null>(null);

  // Utför riktig import
  useEffect(() => {
    const utförImport = async () => {
      try {
        // Steg 1: Skapa saknade konton
        setCurrentTask("Skapar saknade konton...");
        setProgress(20);

        if (settings.skapaKonton && saknadeKonton.length > 0) {
          const kontoData = saknadeKonton.map((nummer) => {
            const kontoInfo = sieData.konton.find((k) => k.nummer === nummer);
            return {
              nummer,
              namn: kontoInfo?.namn || `Konto ${nummer}`,
            };
          });

          const kontoResult = await skapaKonton(kontoData);
          if (!kontoResult.success) {
            throw new Error(kontoResult.error || "Kunde inte skapa konton");
          }
        }

        // Steg 2: Förbereder import
        setCurrentTask("Förbereder dataimport...");
        setProgress(40);
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Steg 3: Importera data
        setCurrentTask("Importerar SIE-data...");
        setProgress(60);

        const fileInfo = selectedFile
          ? {
              filnamn: selectedFile.name,
              filstorlek: selectedFile.size,
            }
          : undefined;

        const importResult = await importeraSieData(sieData, saknadeKonton, settings, fileInfo);
        if (!importResult.success) {
          throw new Error(importResult.error || "Kunde inte importera data");
        }

        // Steg 4: Validering
        setCurrentTask("Validerar importerad data...");
        setProgress(80);
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Steg 5: Slutför
        setCurrentTask("Import slutförd!");
        setProgress(100);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        onComplete(importResult.resultat);
      } catch (err) {
        console.error("Import fel:", err);
        setError(err instanceof Error ? err.message : "Okänt fel");
      }
    };

    utförImport();
  }, []); // Kör bara en gång när komponenten mountas

  if (error) {
    return (
      <div className="text-center">
        <h2 className="text-xl font-semibold text-white mb-8">Import misslyckades</h2>
        <div className="max-w-2xl mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-600 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl">✗</span>
          </div>
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-6 py-4 rounded mb-4 text-left">
            <div className="font-semibold mb-3">
              🚨 Import avbruten - Duplicata verifikationer upptäckta!
            </div>

            {error.includes("Följande verifikationer finns redan") && (
              <>
                <div className="mb-3">
                  <strong>Följande verifikationer finns redan i din databas:</strong>
                </div>
                <div className="bg-red-600/20 p-3 rounded text-sm font-mono max-h-60 overflow-y-auto mb-3">
                  {error
                    .split("• ")
                    .slice(1) // Ta bort första tomma elementet
                    .map((line, index) => (
                      <div key={index} className="mb-1">
                        • {line.split(" 💡")[0]} {/* Ta bort tipset från slutet */}
                      </div>
                    ))}
                </div>
                <div className="text-yellow-300">
                  💡 Detta förhindrar oavsiktliga dubbletter. Om du vill importera ändå, ta först
                  bort de befintliga verifikationerna.
                </div>
              </>
            )}

            {!error.includes("Följande verifikationer finns redan") && (
              <div>
                <strong>Fel:</strong> {error}
              </div>
            )}
          </div>
          <Knapp text="Försök igen" onClick={() => window.location.reload()} />
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <h2 className="text-xl font-semibold text-white mb-8">Steg 4: Importerar data</h2>

      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-lg text-white mb-2">{currentTask}</div>

          {progress === 60 && currentTask.includes("Importerar SIE-data") && (
            <div className="bg-blue-500/20 border border-blue-500 text-blue-300 px-4 py-3 rounded mt-4 text-sm">
              <div className="font-semibold mb-2">⏳ Detta kan ta en stund...</div>
              <div className="text-left text-xs">
                • Skapar konton i databasen
                <br />• Importerar {sieData.verifikationer.length} verifikationer
                <br />• Bearbetar{" "}
                {sieData.verifikationer.reduce(
                  (total, ver) => total + ver.transaktioner.length,
                  0
                )}{" "}
                transaktionsposter
                <br />• Validerar all data för korrekthet
              </div>
            </div>
          )}
        </div>

        <div className="w-full bg-slate-600 rounded-full h-3 mb-4">
          <div
            className="bg-cyan-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <div className="text-sm text-gray-400">{Math.round(progress)}% slutfört</div>
      </div>
    </div>
  );
}

// Komponent för Steg 5: Resultat
function ResultatSteg({ resultat, onFinish }: { resultat: any; onFinish: () => void }) {
  return (
    <div className="text-center">
      <h2 className="text-xl font-semibold text-white mb-8">Import slutförd!</h2>

      <div className="max-w-md mx-auto">
        <div className="w-16 h-16 mx-auto mb-6 bg-green-600 rounded-full flex items-center justify-center">
          <span className="text-white text-2xl">✓</span>
        </div>

        <div className="bg-green-500/20 border border-green-500 text-green-400 px-4 py-3 rounded mb-6">
          <strong>🎉 Klart!</strong> All data har importerats till din databas.
        </div>

        {resultat && (
          <div className="bg-slate-800 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-white mb-3">Importstatistik:</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <div>✅ Konton skapade: {resultat.kontonSkapade || 0}</div>
              <div>✅ Verifikationer importerade: {resultat.verifikationerImporterade || 0}</div>
              <div>✅ Balanser importerade: {resultat.balanserImporterade || 0}</div>
              <div>✅ Resultatposter importerade: {resultat.resultatImporterat || 0}</div>
            </div>
          </div>
        )}

        <div className="space-y-2 text-sm text-gray-400 mb-6">
          <div>• Datavalidering slutförd</div>
          <div>• Import säkert genomförd</div>
        </div>

        <KnappFullWidth text="Tillbaka till SIE-import" onClick={onFinish} />
      </div>
    </div>
  );
}
