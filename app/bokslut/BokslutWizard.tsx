"use client";

import { useState, useEffect } from "react";
import Knapp from "../_components/Knapp";
import KnappFullWidth from "../_components/KnappFullWidth";
import LoadingSpinner from "../_components/LoadingSpinner";
import { hamtaKontosaldo, hamtaSenasteTransaktioner, hamtaBokslutschecklista } from "./actions";
import { genereraNEBilaga } from "./neBilaga";

interface BokslutWizardProps {
  aktivPeriod: string;
  onCancel: () => void;
}

type WizardStep = "checklista" | "paket" | "bokningar" | "resultat" | "färdigställ";

export default function BokslutWizard({ aktivPeriod, onCancel }: BokslutWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>("checklista");
  const [loading, setLoading] = useState(false);
  const [checklistData, setChecklistData] = useState<any>(null);
  const [kontosaldo, setKontosaldo] = useState<any>(null);
  const [neBilaga, setNeBilaga] = useState<any>(null);
  const [bokslutData, setBokslutData] = useState({
    bokslutstyp: "manuellt", // eller "konsult"
    avskrivningar: false,
    periodiseringar: {
      förutbetaldaIntäkter: false,
      förutbetaldaIntäkterBelopp: 0,
      upplupnaKostnader: false,
      upplupnaKostnaderBelopp: 0,
    },
    åretsBokfört: false,
  });

  const steps = [
    {
      id: "checklista",
      title: "Kontrollera bankkonto",
      description: "Kontrollera saldo på företagskonto",
    },
    {
      id: "bokningar",
      title: "Bokslutsbokningar",
      description: "Avskrivningar och periodiseringar",
    },
    {
      id: "resultat",
      title: "Bokför årets resultat",
      description: "Beräkna och bokför resultatet",
    },
    { id: "färdigställ", title: "Färdigställ", description: "Generera NE-bilaga" },
  ];

  const currentStepIndex = steps.findIndex((step) => step.id === currentStep);

  useEffect(() => {
    if (currentStep === "checklista") {
      loadChecklistData();
    }
  }, [currentStep, aktivPeriod]);

  const loadChecklistData = async () => {
    setLoading(true);
    try {
      const ar = parseInt(aktivPeriod);
      const [saldo, lista] = await Promise.all([hamtaKontosaldo(ar), hamtaBokslutschecklista(ar)]);
      setKontosaldo(saldo);
      setChecklistData(lista);
    } catch (error) {
      console.error("Fel vid laddning av checklistdata:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateNEBilaga = async () => {
    setLoading(true);
    try {
      const ar = parseInt(aktivPeriod);
      const data = await genereraNEBilaga(ar);
      setNeBilaga(data);
    } catch (error) {
      console.error("Fel vid generering av NE-bilaga:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency: "SEK",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="h-screen bg-slate-800 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto min-h-full">
        {/* Header */}
        <div className="bg-slate-700 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">Bokslut-wizard {aktivPeriod}</h1>
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
        <div className="bg-slate-700 rounded-lg p-6 max-h-[calc(100vh-300px)] overflow-y-auto">
          {currentStep === "checklista" && (
            <ChecklistaSteg
              kontosaldo={kontosaldo}
              checklistData={checklistData}
              loading={loading}
              onNext={() => setCurrentStep("bokningar")}
            />
          )}

          {currentStep === "bokningar" && (
            <BokningarSteg
              periodiseringar={bokslutData.periodiseringar}
              avskrivningar={bokslutData.avskrivningar}
              onPeriodiceringsChange={(data: any) =>
                setBokslutData((prev) => ({ ...prev, periodiseringar: data }))
              }
              onAvskrivningarChange={(value: boolean) =>
                setBokslutData((prev) => ({ ...prev, avskrivningar: value }))
              }
              onNext={() => setCurrentStep("resultat")}
              onBack={() => setCurrentStep("checklista")}
            />
          )}

          {currentStep === "resultat" && (
            <ResultatSteg
              kontosaldo={kontosaldo}
              onNext={() => setCurrentStep("färdigställ")}
              onBack={() => setCurrentStep("bokningar")}
            />
          )}

          {currentStep === "färdigställ" && (
            <FärdigställSteg
              aktivPeriod={aktivPeriod}
              neBilaga={neBilaga}
              loading={loading}
              onGenerateNE={generateNEBilaga}
              onBack={() => setCurrentStep("resultat")}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Steg 1: Kontrollera bankkonto
function ChecklistaSteg({ kontosaldo, checklistData, loading, onNext }: any) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <LoadingSpinner />
        <p className="text-gray-400 mt-4">Laddar kontosaldo...</p>
      </div>
    );
  }

  const företagskonto = kontosaldo?.find((k: any) => k.kontonummer === "1930");

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-6">Steg 1 - Kontrollera bankkonto</h2>

      <div className="space-y-6">
        {företagskonto ? (
          <div className="bg-slate-800 rounded-lg p-6">
            <h3 className="text-lg font-medium text-white mb-4">🏦 Företagskonto (1930)</h3>

            <div className="bg-slate-900 rounded-lg p-4 mb-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-400 mb-2">
                  {företagskonto.saldo?.toLocaleString("sv-SE")} kr
                </div>
                <p className="text-gray-400 text-sm">Aktuellt saldo i bokföringen</p>
              </div>
            </div>

            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <span className="text-blue-400 text-lg">💡</span>
                <div>
                  <h4 className="text-blue-400 font-medium mb-1">Kontrollera mot banken</h4>
                  <p className="text-blue-200 text-sm">
                    Logga in på din bank och kontrollera att saldot stämmer överens. Detta är det
                    viktigaste steget före bokslut.
                  </p>
                </div>
              </div>
            </div>

            {företagskonto.antal_transaktioner && (
              <div className="mt-4 text-sm text-gray-400">
                Antal transaktioner: {företagskonto.antal_transaktioner}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <span className="text-red-400 text-lg">⚠️</span>
              <div>
                <h4 className="text-red-400 font-medium mb-1">Företagskonto saknas</h4>
                <p className="text-red-200 text-sm">
                  Konto 1930 (Företagskonto) finns inte i bokföringen. Du behöver skapa detta konto
                  först.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end mt-8">
        <KnappFullWidth
          text="Fortsätt till bokslutsbokningar"
          onClick={onNext}
          disabled={!företagskonto}
        />
      </div>
    </div>
  );
}

// Steg 2: Bokslutsbokningar
function BokningarSteg({
  periodiseringar,
  avskrivningar,
  onPeriodiceringsChange,
  onAvskrivningarChange,
  onNext,
  onBack,
}: any) {
  const handlePeriodiceringsChange = (field: string, value: any) => {
    onPeriodiceringsChange({
      ...periodiseringar,
      [field]: value,
    });
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-6">Steg 2 - Bokslutsbokningar</h2>

      <div className="space-y-6">
        {/* Avskrivningar */}
        <div className="bg-slate-800 rounded-lg p-4">
          <h3 className="text-lg font-medium text-white mb-3">📉 Avskrivningar</h3>
          <p className="text-gray-300 text-sm mb-4">
            Finns det bokförda tillgångar i verksamheten måste dessa skrivas av om beräknad
            livslängd är högst 3 år eller om värdet är högst ett halvt prisbasbelopp (≈ 24 000 SEK).
          </p>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="avskrivningar"
              checked={avskrivningar}
              onChange={(e) => onAvskrivningarChange(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="avskrivningar" className="text-white text-sm">
              Jag har tillgångar som ska skrivas av
            </label>
          </div>
        </div>

        {/* Periodiseringar */}
        <div className="bg-slate-800 rounded-lg p-4">
          <h3 className="text-lg font-medium text-white mb-3">
            ⏰ Förutbetalda intäkter och upplupna kostnader
          </h3>
          <p className="text-gray-300 text-sm mb-4">
            Periodiseringar krävs när en faktura och prestationen sker under olika verksamhetsår. Du
            behöver bara periodisera utgifter/inkomster som är på 5 000 kr och uppåt.
          </p>

          <div className="space-y-4">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="checkbox"
                  id="förutbetalda"
                  checked={periodiseringar.förutbetaldaIntäkter}
                  onChange={(e) =>
                    handlePeriodiceringsChange("förutbetaldaIntäkter", e.target.checked)
                  }
                  className="rounded"
                />
                <label htmlFor="förutbetalda" className="text-white text-sm">
                  Jag har förutbetalda intäkter att periodisera
                </label>
              </div>
              {periodiseringar.förutbetaldaIntäkter && (
                <input
                  type="number"
                  placeholder="Belopp i SEK"
                  value={periodiseringar.förutbetaldaIntäkterBelopp}
                  onChange={(e) =>
                    handlePeriodiceringsChange(
                      "förutbetaldaIntäkterBelopp",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="w-full p-2 bg-slate-900 text-white rounded border border-gray-600"
                />
              )}
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="checkbox"
                  id="upplupna"
                  checked={periodiseringar.upplupnaKostnader}
                  onChange={(e) =>
                    handlePeriodiceringsChange("upplupnaKostnader", e.target.checked)
                  }
                  className="rounded"
                />
                <label htmlFor="upplupna" className="text-white text-sm">
                  Jag har upplupna kostnader att periodisera
                </label>
              </div>
              {periodiseringar.upplupnaKostnader && (
                <input
                  type="number"
                  placeholder="Belopp i SEK"
                  value={periodiseringar.upplupnaKostnaderBelopp}
                  onChange={(e) =>
                    handlePeriodiceringsChange(
                      "upplupnaKostnaderBelopp",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="w-full p-2 bg-slate-900 text-white rounded border border-gray-600"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <Knapp text="Tillbaka" onClick={onBack} />
        <KnappFullWidth text="Bekräfta och fortsätt" onClick={onNext} />
      </div>
    </div>
  );
}

// Steg 3: Bokför årets resultat
function ResultatSteg({ kontosaldo, onNext, onBack }: any) {
  const beräknaÅretsResultat = () => {
    if (!kontosaldo) return 0;

    // Beräkna intäkter (konto 3000-3999) - kredit
    const intäkter = kontosaldo
      .filter((k: any) => k.kontonummer >= "3000" && k.kontonummer < "4000")
      .reduce((sum: number, k: any) => sum + (k.saldo || 0), 0);

    // Beräkna kostnader (konto 4000-8999) - debet
    const kostnader = kontosaldo
      .filter((k: any) => k.kontonummer >= "4000" && k.kontonummer < "9000")
      .reduce((sum: number, k: any) => sum + Math.abs(k.saldo || 0), 0);

    return intäkter - kostnader;
  };

  const årsresultat = beräknaÅretsResultat();

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-6">Steg 3 - Bokför årets resultat</h2>

      <div className="bg-slate-800 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium text-white mb-4">📊 Beräknat årsresultat</h3>

        <div className="text-center py-8">
          <div className="text-4xl font-bold text-cyan-400 mb-2">
            {årsresultat.toLocaleString("sv-SE")} kr
          </div>
          <p className="text-gray-400">{årsresultat >= 0 ? "Årets vinst" : "Årets förlust"}</p>
        </div>

        <div className="border-t border-gray-600 pt-4">
          <p className="text-gray-300 text-sm">
            När du bokför årets resultat kommer detta belopp att föras över till rätt konto i
            balansräkningen. För enskild firma förs resultatet till konto 2018 (Årets resultat).
          </p>
        </div>
      </div>

      <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-2">
          <span className="text-yellow-400 text-lg">⚠️</span>
          <div>
            <h4 className="text-yellow-400 font-medium">Viktigt</h4>
            <p className="text-yellow-200 text-sm">
              Kontrollera att beräkningen stämmer innan du fortsätter. När årets resultat är bokfört
              kan det inte enkelt ändras.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <Knapp text="Tillbaka" onClick={onBack} />
        <KnappFullWidth text="Bokför årets resultat" onClick={onNext} />
      </div>
    </div>
  );
}

// Steg 4: Färdigställ
function FärdigställSteg({ aktivPeriod, neBilaga, loading, onGenerateNE, onBack }: any) {
  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-6">Steg 4 - Färdigställ bokslut</h2>

      <div className="bg-slate-800 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium text-white mb-4">
          🎉 Grattis! Bokslutet är nästan klart
        </h3>
        <p className="text-gray-300 mb-4">
          Nu stänger du året och får fram NE-blanketten för räkenskapsåret {aktivPeriod}. Tänk på
          att denna är ett underlag du använder när du fyller i hos Skatteverket.
        </p>
      </div>

      {!neBilaga ? (
        <div className="text-center py-8">
          {loading ? (
            <>
              <LoadingSpinner />
              <p className="text-gray-400 mt-4">Genererar NE-bilaga...</p>
            </>
          ) : (
            <KnappFullWidth text="🧾 Generera NE-bilaga" onClick={onGenerateNE} />
          )}
        </div>
      ) : (
        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4">📄 NE-bilaga {aktivPeriod}</h3>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-900 rounded p-3">
              <div className="text-gray-400 text-sm">B1 - Nettoomsättning</div>
              <div className="text-white text-lg font-bold">
                {neBilaga?.neBilaga?.B1?.toLocaleString("sv-SE") || "0"} kr
              </div>
            </div>

            <div className="bg-slate-900 rounded p-3">
              <div className="text-gray-400 text-sm">B9 - Årets resultat före skatt</div>
              <div className="text-white text-lg font-bold">
                {neBilaga?.neBilaga?.B9?.toLocaleString("sv-SE") || "0"} kr
              </div>
            </div>
          </div>

          <div className="border-t border-gray-600 pt-4">
            <p className="text-gray-300 text-sm mb-4">
              NE-bilagan är nu klar att användas som underlag för din deklaration. Du kan behöva
              lägga till vissa personliga uppgifter som inte ingår i bokföringen.
            </p>

            <KnappFullWidth text="📥 Ladda ner NE-bilaga" />
          </div>
        </div>
      )}

      <div className="flex justify-between mt-8">
        {!neBilaga && <Knapp text="Tillbaka" onClick={onBack} />}
        {neBilaga && (
          <KnappFullWidth text="🎉 Bokslut slutfört" onClick={() => window.location.reload()} />
        )}
      </div>
    </div>
  );
}
