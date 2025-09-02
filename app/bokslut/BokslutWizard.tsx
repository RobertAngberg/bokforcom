"use client";

import { useState, useEffect } from "react";
import Knapp from "../_components/Knapp";
import Knapp from "../_components/Knapp";
import LoadingSpinner from "../_components/LoadingSpinner";
import TextFalt from "../_components/TextFalt";
import { hamtaKontosaldo, hamtaSenasteTransaktioner } from "./actions";

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
      const [saldo, transaktioner] = await Promise.all([
        hamtaKontosaldo(ar),
        hamtaSenasteTransaktioner(ar),
      ]);
      setKontosaldo(saldo);

      // Generera checklistan på frontend baserat på faktisk data
      const dynamiskChecklista = generateBokslutChecklist(saldo, transaktioner);
      setChecklistData(dynamiskChecklista);
    } catch (error) {
      console.error("Fel vid laddning av checklistdata:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateNEBilaga = async () => {
    setLoading(true);
    try {
      // Använd befintlig kontosaldo-data om den finns, annars hämta ny
      let saldoData = kontosaldo;
      if (!saldoData) {
        const ar = parseInt(aktivPeriod);
        saldoData = await hamtaKontosaldo(ar);
        setKontosaldo(saldoData);
      }

      // Generera NE-bilaga på frontend baserat på kontosaldo
      const data = generateNEBilagaFromKontosaldo(saldoData);
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

  // Valideringsfunktioner (flyttade från actions.ts)
  const sanitizeBokslutInput = (text: string): string => {
    if (!text || typeof text !== "string") return "";

    return text
      .replace(/[<>'"&{}()[\]]/g, "") // Ta bort XSS-farliga tecken
      .replace(/\s+/g, " ") // Normalisera whitespace
      .trim()
      .substring(0, 500); // Begränsa längd
  };

  const validateNumericInput = (value: number): boolean => {
    return !isNaN(value) && isFinite(value) && value >= 0 && value < 1000000000;
  };

  const validateDateInput = (dateString: string): boolean => {
    const date = new Date(dateString);
    const currentYear = new Date().getFullYear();
    const inputYear = date.getFullYear();

    return !isNaN(date.getTime()) && inputYear >= 2020 && inputYear <= currentYear + 1;
  };

  const validatePeriod = (period: string): boolean => {
    // Endast år-format accepteras (YYYY)
    const yearPattern = /^\d{4}$/;
    if (!yearPattern.test(period)) return false;

    const year = parseInt(period);
    const currentYear = new Date().getFullYear();

    return year >= 2020 && year <= currentYear + 1;
  };

  // Dynamisk checklista-generering (flyttad från actions.ts)
  const generateBokslutChecklist = (kontosaldo: any[], transaktioner: any[] = []) => {
    const antalTransaktioner = transaktioner.length;
    const harBanktransaktioner =
      kontosaldo?.some((k) => k.kontonummer === "1930" && k.antalTransaktioner > 0) || false;
    const antalBokslutsjusteringar = transaktioner.filter((t) =>
      t.beskrivning?.includes("BOKSLUT:")
    ).length;

    return [
      { uppgift: "Kontrollera alla verifikat är bokförda", klar: antalTransaktioner > 0 },
      { uppgift: "Genomför bankavstämningar för alla konton", klar: harBanktransaktioner },
      { uppgift: "Kontrollera och inventera lager", klar: false },
      { uppgift: "Beräkna och bokför avskrivningar", klar: antalBokslutsjusteringar > 0 },
      { uppgift: "Bokför upplupna kostnader (löner, hyror, räntor)", klar: false },
      { uppgift: "Kontrollera semesterlöneskuld och sociala avgifter", klar: false },
      { uppgift: "Granska kundfordringar och bedöm osäkra fordringar", klar: false },
      { uppgift: "Kontrollera leverantörsskulder", klar: false },
      { uppgift: "Genomför momsavstämning", klar: false },
      { uppgift: "Granska och bokför avsättningar", klar: false },
      { uppgift: "Kontrollera periodiseringar (förutbetalda/upplupna)", klar: false },
      { uppgift: "Upprätta preliminär resultat- och balansräkning", klar: false },
      { uppgift: "Granska skattemässiga justeringar", klar: false },
      { uppgift: "Kontrollera substansrapporten", klar: false },
      { uppgift: "Upprätta slutlig årsredovisning", klar: false },
      { uppgift: "Revisorsgranskning och revision", klar: false },
      { uppgift: "Fastställelse av årsredovisning på bolagsstämma", klar: false },
      { uppgift: "Inlämning till Bolagsverket (senast 31 juli)", klar: false },
      { uppgift: "Skattedeklaration (senast 18 maj)", klar: false },
      { uppgift: "Kontrolluppgifter till Skatteverket", klar: false },
    ];
  };

  // Bokslutsjustering-kalkylator (flyttad från actions.ts)
  const calculateTotalBelopp = (poster: Array<{ debet: number; kredit: number }>) => {
    return poster.reduce((sum, post) => sum + post.debet, 0);
  };

  const validateBokslutsPoster = (
    poster: Array<{ kontonummer: string; debet: number; kredit: number }>
  ) => {
    return poster.every(
      (post) =>
        validateNumericInput(post.debet) &&
        validateNumericInput(post.kredit) &&
        /^\d{4}$/.test(post.kontonummer)
    );
  };

  const validateBokslutsjusteringData = (data: {
    beskrivning: string;
    datum: string;
    poster: Array<{ kontonummer: string; debet: number; kredit: number }>;
    kommentar?: string;
  }) => {
    const beskrivning = sanitizeBokslutInput(data.beskrivning);
    const kommentar = sanitizeBokslutInput(data.kommentar || "");

    if (!beskrivning || beskrivning.length < 2) {
      return { valid: false, error: "Ogiltig beskrivning för bokslutsjustering" };
    }

    if (!validateDateInput(data.datum)) {
      return { valid: false, error: "Ogiltigt datum för bokslutsjustering" };
    }

    if (!validateBokslutsPoster(data.poster)) {
      return { valid: false, error: "Ogiltiga belopp eller kontonummer i bokslutsjusteringar" };
    }

    return { valid: true, beskrivning, kommentar };
  };

  // NE-bilaga business logic (flyttad från neBilaga.ts)
  const mappaKontoTillNEPunkt = (kontonummer: string): string | null => {
    const konto = parseInt(kontonummer);

    // BALANSRÄKNING - TILLGÅNGAR
    if (konto >= 1100 && konto <= 1199) return "B1"; // Immateriella anläggningstillgångar
    if (konto >= 1200 && konto <= 1299) return "B2"; // Byggnader och markanläggningar
    if (konto >= 1300 && konto <= 1399) return "B3"; // Mark och andra tillgångar som inte får skrivas av
    if (konto >= 1400 && konto <= 1499) return "B4"; // Maskiner och inventarier
    if (konto >= 1500 && konto <= 1699) return "B8"; // Övriga fordringar (kundfordringar etc)
    if (konto >= 1400 && konto <= 1489) return "B6"; // Varulager (del av 1400-serien)
    if (konto >= 1510 && konto <= 1579) return "B7"; // Kundfordringar
    if (konto >= 1900 && konto <= 1999) return "B9"; // Kassa och bank

    // BALANSRÄKNING - EGET KAPITAL OCH SKULDER
    if (konto >= 2000 && konto <= 2099) return "B10"; // Eget kapital
    if (konto >= 2100 && konto <= 2199) return "B11"; // Obeskattade reserver
    if (konto >= 2200 && konto <= 2299) return "B12"; // Avsättningar
    if (konto >= 2300 && konto <= 2399) return "B13"; // Låneskulder
    if (konto >= 2500 && konto <= 2599) return "B14"; // Skatteskulder
    if (konto >= 2400 && konto <= 2499) return "B15"; // Leverantörsskulder
    if (konto >= 2600 && konto <= 2999) return "B16"; // Övriga skulder (moms, etc)

    // RESULTATRÄKNING - INTÄKTER
    if (konto >= 3000 && konto <= 3999) return "R1"; // Försäljning och utfört arbete
    if (konto >= 8100 && konto <= 8199) return "R2"; // Momsfria intäkter
    if (konto >= 8200 && konto <= 8299) return "R3"; // Bil- och bostadsförmån
    if (konto >= 8300 && konto <= 8399) return "R4"; // Ränteintäkter

    // RESULTATRÄKNING - KOSTNADER
    if (konto >= 4000 && konto <= 4999) return "R5"; // Varor, material och tjänster
    if (konto >= 5000 && konto <= 6999) return "R6"; // Övriga externa kostnader
    if (konto >= 7000 && konto <= 7699) return "R7"; // Anställd personal
    if (konto >= 8400 && konto <= 8499) return "R8"; // Räntekostnader
    if (konto >= 7700 && konto <= 7799) return "R9"; // Av- och nedskrivningar byggnader
    if (konto >= 7800 && konto <= 7899) return "R10"; // Av- och nedskrivningar maskiner

    return null; // Okänt konto
  };

  const generateNEBilagaFromKontosaldo = (kontosaldoData: any[]) => {
    // Initialisera NE-bilaga med alla punkter som 0
    const neBilaga: Record<string, number> = {};

    // Balansräkning
    [
      "B1",
      "B2",
      "B3",
      "B4",
      "B5",
      "B6",
      "B7",
      "B8",
      "B9",
      "B10",
      "B11",
      "B12",
      "B13",
      "B14",
      "B15",
      "B16",
    ].forEach((punkt) => {
      neBilaga[punkt] = 0;
    });

    // Resultaträkning
    ["R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8", "R9", "R10", "R11", "R13", "R14"].forEach(
      (punkt) => {
        neBilaga[punkt] = 0;
      }
    );

    // Underskriftsblad
    ["U1", "U2", "U3", "U4"].forEach((punkt) => {
      neBilaga[punkt] = 0;
    });

    // Mappa alla konton till NE-punkter
    for (const row of kontosaldoData) {
      const punkt = mappaKontoTillNEPunkt(row.kontonummer);
      if (punkt && row.saldo) {
        // För tillgångar och kostnader: positivt saldo = positivt värde
        // För skulder och intäkter: negativt saldo = positivt värde (de ökar på kredit-sidan)
        const kontoklass = row.kontoklass?.toLowerCase() || "";
        let varde = parseFloat(row.saldo);

        if (
          kontoklass.includes("skulder") ||
          kontoklass.includes("intäkter") ||
          punkt.startsWith("R")
        ) {
          varde = Math.abs(varde); // Gör positiva för NE-bilagan
        }

        neBilaga[punkt] += varde;
      }
    }

    // Beräkna bokfört resultat (R11) = Intäkter - Kostnader
    neBilaga["R11"] =
      neBilaga["R1"] +
      neBilaga["R2"] +
      neBilaga["R3"] +
      neBilaga["R4"] -
      (neBilaga["R5"] +
        neBilaga["R6"] +
        neBilaga["R7"] +
        neBilaga["R8"] +
        neBilaga["R9"] +
        neBilaga["R10"]);

    return {
      ar: parseInt(aktivPeriod),
      neBilaga,
      genererad: new Date().toISOString(),
    };
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
        <Knapp fullWidth
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
                <TextFalt
                  name="förutbetaldaIntäkterBelopp"
                  label=""
                  type="number"
                  placeholder="Belopp i SEK"
                  value={periodiseringar.förutbetaldaIntäkterBelopp.toString()}
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
                <TextFalt
                  name="upplupnaKostnaderBelopp"
                  label=""
                  type="number"
                  placeholder="Belopp i SEK"
                  value={periodiseringar.upplupnaKostnaderBelopp.toString()}
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
        <Knapp fullWidth text="Bekräfta och fortsätt" onClick={onNext} />
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
        <Knapp fullWidth text="Bokför årets resultat" onClick={onNext} />
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
            <Knapp fullWidth text="🧾 Generera NE-bilaga" onClick={onGenerateNE} />
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

            <Knapp fullWidth text="📥 Ladda ner NE-bilaga" />
          </div>
        </div>
      )}

      <div className="flex justify-between mt-8">
        {!neBilaga && <Knapp text="Tillbaka" onClick={onBack} />}
        {neBilaga && (
          <Knapp fullWidth text="🎉 Bokslut slutfört" onClick={() => window.location.reload()} />
        )}
      </div>
    </div>
  );
}
