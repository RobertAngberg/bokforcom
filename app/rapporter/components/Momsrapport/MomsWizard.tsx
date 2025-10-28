"use client";

import React, { useState, useEffect } from "react";
import Knapp from "../../../_components/Knapp";
import Modal from "../../../_components/Modal";
import Tabell, { ColumnDefinition } from "../../../_components/Tabell";
import { useMomsrapportStatus } from "../../hooks/useMomsrapportStatus";
import { MomsRad } from "../../types/types";
import { formatSEK } from "../../../_utils/format";
import { validateMomsVerifikat, type ValidationResult } from "../../actions/momsValidationActions";
import { bokforMomsavstamning } from "../../actions/momsBokforingActions";

interface MomsWizardProps {
  isOpen: boolean;
  onClose: () => void;
  year: string;
  period: string;
  momsData: MomsRad[];
  organisationsnummer: string;
  onExportXML: () => void;
}

export default function MomsWizard({
  isOpen,
  onClose,
  year,
  period,
  momsData,
  organisationsnummer,
  onExportXML,
}: MomsWizardProps) {
  const { updateStatus } = useMomsrapportStatus(parseInt(year), period);

  const [currentStep, setCurrentStep] = useState(1);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [hideOkVerifikat, setHideOkVerifikat] = useState(true);
  const [isBokforing, setIsBokforing] = useState(false);
  const [bokforingSuccess, setBokforingSuccess] = useState(false);

  // Beräkna moms att betala
  const momsAttBetala = momsData.find((r) => r.fält === "49")?.belopp ?? 0;

  // Beräkna bokföringsposter baserat på momsdata (för förhandsvisning)
  const genereraBokforingsposter = () => {
    const poster: { konto: string; kontonamn: string; debet: number; kredit: number }[] = [];

    // OBS: Detta är bara en förhandsvisning. Den faktiska bokföringen hämtar saldon från databasen.
    // För att visa användaren ungefär vad som kommer att bokföras

    const utgaendeMoms25 = Math.abs(momsData.find((r) => r.fält === "10")?.belopp ?? 0);
    const utgaendeOmvand25 = Math.abs(momsData.find((r) => r.fält === "30")?.belopp ?? 0);
    const ingaendeMoms = Math.abs(momsData.find((r) => r.fält === "48")?.belopp ?? 0);
    const momsAttBetala = momsData.find((r) => r.fält === "49")?.belopp ?? 0;

    if (utgaendeMoms25 > 0) {
      poster.push({
        konto: "2610",
        kontonamn: "Utgående moms, 25 %",
        debet: utgaendeMoms25,
        kredit: 0,
      });
    }
    if (utgaendeOmvand25 > 0) {
      poster.push({
        konto: "2614",
        kontonamn: "Utgående moms omvänd skattskyldighet, 25 %",
        debet: utgaendeOmvand25,
        kredit: 0,
      });
      // När det finns omvänd moms så finns ofta också 2645
      poster.push({
        konto: "2645",
        kontonamn: "Beräknad ingående moms på förvärv från utlandet",
        debet: 0,
        kredit: utgaendeOmvand25,
      });
    }

    // Övrig ingående moms (2640)
    const ovrigIngaende = ingaendeMoms - utgaendeOmvand25;
    if (ovrigIngaende > 0) {
      poster.push({ konto: "2640", kontonamn: "Ingående moms", debet: 0, kredit: ovrigIngaende });
    }

    if (Math.abs(momsAttBetala) > 0.01) {
      poster.push({
        konto: "2650",
        kontonamn: "Redovisningskonto för moms",
        debet: momsAttBetala < 0 ? Math.abs(momsAttBetala) : 0,
        kredit: momsAttBetala > 0 ? momsAttBetala : 0,
      });
    }

    return poster;
  };

  const bokforingsposter = genereraBokforingsposter();

  // Definiera kolumner för Tabell-komponenten
  type BokforingsPost = { konto: string; kontonamn: string; debet: number; kredit: number };

  const bokforingsKolumner: ColumnDefinition<BokforingsPost>[] = [
    { key: "konto", label: "Konto", className: "font-mono" },
    { key: "kontonamn", label: "Kontonamn" },
    {
      key: "debet",
      label: "Debet",
      className: "text-right",
      render: (_, row) => (row.debet > 0 ? formatSEK(row.debet) : "—"),
    },
    {
      key: "kredit",
      label: "Kredit",
      className: "text-right",
      render: (_, row) => (row.kredit > 0 ? formatSEK(row.kredit) : "—"),
    },
  ];

  const handleBokfor = async () => {
    setIsBokforing(true);
    setBokforingSuccess(false);

    try {
      const result = await bokforMomsavstamning(year, period);

      if (result.success) {
        setBokforingSuccess(true);
      } else {
        alert(`Fel vid bokföring: ${result.error}`);
      }
    } catch (error) {
      alert(`Fel vid bokföring: ${error instanceof Error ? error.message : "Okänt fel"}`);
    } finally {
      setIsBokforing(false);
    }
  };

  // Kör validering när steg 2 visas
  useEffect(() => {
    if (currentStep === 2 && !validationResult) {
      runValidation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  const runValidation = async () => {
    setIsValidating(true);
    const result = await validateMomsVerifikat(parseInt(year), period);
    setValidationResult(result);
    setIsValidating(false);
  };

  const handleStepComplete = async () => {
    if (currentStep === 1) {
      // Steg 1: Gå till validering
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Steg 2: Markera som granskad och gå till export
      await updateStatus("granskad");
      setCurrentStep(3);
    } else if (currentStep === 3) {
      // Steg 3: Markera som deklarerad
      await updateStatus("deklarerad");
      setCurrentStep(4);
    } else if (currentStep === 4) {
      // Steg 4: Gå till stäng period
      await updateStatus("betald");
      setCurrentStep(5);
    } else if (currentStep === 5) {
      // Steg 5: Stäng period och avsluta
      await updateStatus("stängd");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Momsdeklaration" maxWidth="2xl">
      <div className="space-y-6">
        {/* Progress bar */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {[1, 2, 3, 4, 5].map((step) => (
            <React.Fragment key={step}>
              <div
                className={`mt-2 w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  currentStep === step
                    ? "bg-cyan-500 text-white ring-4 ring-cyan-500/30 scale-110"
                    : currentStep > step
                      ? "bg-green-500 text-white"
                      : "bg-slate-700 text-slate-400"
                }`}
              >
                {currentStep > step ? "✓" : step}
              </div>
              {step < 5 && (
                <div
                  className={`w-12 h-1 rounded transition-all ${
                    currentStep > step ? "bg-green-500" : "bg-slate-700"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Avstämning */}
        {currentStep === 1 && (
          <div className="space-y-4">
            {/* Moms att betala/få tillbaka - stor display */}
            <div className="text-center py-2">
              <p className="text-slate-300 text-sm mb-1">
                {momsAttBetala > 0
                  ? "Moms att betala"
                  : momsAttBetala < 0
                    ? "Moms att få tillbaka"
                    : "Ingen moms"}
              </p>
              <p className="text-3xl font-bold text-cyan-400">
                {formatSEK(Math.abs(momsAttBetala))}
              </p>
            </div>

            <h3 className="text-xl font-bold text-slate-100 text-center mt-4">Avstämning</h3>
            <p className="text-slate-300">
              Innan du fortsätter måste alla utgifter, inkomster och fakturor för perioden vara
              bokförda. Momsen för föregående period skall också vara bokförd.
            </p>

            <div className="flex justify-end">
              <Knapp text="Nästa →" onClick={handleStepComplete} />
            </div>
          </div>
        )}

        {/* Step 2: Momskontroll */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-100 text-center mt-4">Momskontroll</h3>
            <p className="text-slate-300">
              Validerar alla verifikat för perioden och kontrollerar momsbokföring.
            </p>

            {isValidating ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
              </div>
            ) : validationResult ? (
              <div className="space-y-4">
                {/* Sammanfattning */}
                <div className="bg-slate-800 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-slate-400 text-sm">Totalt verifikat</p>
                      <p className="text-2xl font-bold text-white">
                        {validationResult.totalVerifikat}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Behöver granskas</p>
                      <p className="text-2xl font-bold text-orange-500">
                        {validationResult.verifikatMedVarningar}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Filter */}
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hideOkVerifikat}
                      onChange={(e) => setHideOkVerifikat(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span>Dölj OK verifikat</span>
                  </label>
                </div>

                {/* Verifikatlista */}
                <div className="bg-slate-800 p-4 rounded-lg max-h-96 overflow-y-auto">
                  {validationResult.verifikat
                    .filter((v) => !hideOkVerifikat || v.status !== "ok")
                    .map((verifikat) => (
                      <div
                        key={verifikat.transaktions_id}
                        className={`p-3 mb-2 rounded ${
                          verifikat.status === "ok"
                            ? "bg-green-900/20 border-l-4 border-green-500"
                            : verifikat.status === "fel"
                              ? "bg-red-900/20 border-l-4 border-red-500"
                              : "bg-orange-900/20 border-l-4 border-orange-500"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-slate-200 font-medium">
                            {verifikat.kontobeskrivning}
                          </span>
                          <span className="text-slate-400 text-sm">
                            {new Date(verifikat.transaktionsdatum).toLocaleDateString("sv-SE")}
                          </span>
                        </div>
                        <div className="text-slate-300 text-sm mb-1">
                          {formatSEK(verifikat.belopp)}
                        </div>
                        {verifikat.kommentar && (
                          <div className="text-slate-400 text-xs mb-2">{verifikat.kommentar}</div>
                        )}
                        {verifikat.varningar.length > 0 && (
                          <ul className="list-disc list-inside text-sm">
                            {verifikat.varningar.map((varning, idx) => (
                              <li
                                key={idx}
                                className={
                                  verifikat.status === "fel" ? "text-red-400" : "text-orange-400"
                                }
                              >
                                {varning}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}

                  {validationResult.verifikat.filter((v) => !hideOkVerifikat || v.status !== "ok")
                    .length === 0 && (
                    <p className="text-slate-400 text-center py-4">
                      {hideOkVerifikat
                        ? "Inga verifikat behöver granskas! 🎉"
                        : "Inga verifikat hittades för perioden."}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400 py-8">
                Kunde inte validera verifikat. Kontrollera din anslutning och försök igen.
              </div>
            )}

            <div className="flex justify-between">
              <Knapp text="← Tillbaka" onClick={() => setCurrentStep(1)} />
              <Knapp text="Nästa →" onClick={handleStepComplete} disabled={!validationResult} />
            </div>
          </div>
        )}

        {/* Step 3: Exportera XML */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-100 text-center mt-4">Exportera XML</h3>
            <p className="text-slate-300">
              Ladda ner XML-filen och ladda upp den till Skatteverket.
            </p>

            <div className="bg-slate-800 p-6 rounded-lg space-y-4">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">📄</span>
                <div>
                  <h4 className="font-bold text-slate-100">Momsdeklaration {year}</h4>
                  <p className="text-sm text-slate-400">Period: {period}</p>
                  <p className="text-sm text-slate-400">Org.nr: {organisationsnummer}</p>
                </div>
              </div>

              <Knapp
                text="📥 Ladda ner XML-fil"
                onClick={() => {
                  onExportXML();
                  setTimeout(() => setCurrentStep(4), 1000);
                }}
                className="w-full"
              />

              <a
                href="https://www.skatteverket.se/foretag/moms/deklareramoms.4.7459477810df5bccdd480006935.html"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-slate-700 hover:bg-slate-600 text-slate-100 py-2 px-4 rounded-lg transition-colors"
              >
                🔗 Öppna hos Skatteverket
              </a>
            </div>

            <div className="flex justify-between">
              <Knapp text="← Tillbaka" onClick={() => setCurrentStep(2)} />
              <Knapp text="Nästa →" onClick={() => setCurrentStep(4)} />
            </div>
          </div>
        )}

        {/* Step 4: Betala */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-xl text-center font-bold text-slate-100 mt-4">
              Bokföring och betalning
            </h3>

            {/* Bokföringsförslag */}
            <div className="bg-slate-800 p-4 rounded-lg">
              <p className="text-slate-300 text-sm mb-3">
                Detta skapar ett verifikat med följande poster:
              </p>

              <Tabell
                data={bokforingsposter}
                columns={bokforingsKolumner}
                getRowId={(row) => row.konto}
              />

              <div className="mt-4">
                {bokforingSuccess ? (
                  <div className="bg-green-900/20 border border-green-500 p-3 rounded-lg text-green-400">
                    ✓ Bokföring genomförd!
                  </div>
                ) : (
                  <Knapp
                    text={isBokforing ? "Bokför..." : "Bokför momsavstämning"}
                    onClick={handleBokfor}
                    disabled={isBokforing}
                    className="w-full"
                  />
                )}
              </div>
            </div>

            {momsAttBetala !== 0 && (
              <div className="bg-slate-800 p-4 rounded-lg">
                <h4 className="font-bold text-slate-100 mb-2">
                  {momsAttBetala > 0 ? "Betala moms" : "Få tillbaka moms"}
                </h4>
                {momsAttBetala > 0 ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-300">Belopp:</span>
                      <span className="font-bold text-slate-100">{formatSEK(momsAttBetala)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Bankgiro:</span>
                      <span className="font-bold text-slate-100">5050-1055</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-300 text-sm">
                    Skatteverket betalar ut {formatSEK(Math.abs(momsAttBetala))} till ditt
                    skattekonto.
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-between">
              <Knapp text="← Tillbaka" onClick={() => setCurrentStep(3)} />
              <Knapp text="Nästa →" onClick={handleStepComplete} disabled={!bokforingSuccess} />
            </div>
          </div>
        )}

        {/* Step 5: Stäng period */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <h3 className="text-xl text-center font-bold text-slate-100 mt-4">
              Stäng momsperioden
            </h3>

            <div className="bg-slate-800 p-6 rounded-lg">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">🔒</div>
                <h4 className="font-bold text-slate-100 text-xl mb-3">
                  Perioden är nu klar att stängas
                </h4>
                <p className="text-slate-300 mb-2">
                  När du stänger perioden kan inga fler transaktioner bokföras för denna period.
                </p>
                <p className="text-slate-300 text-sm">
                  Detta förhindrar oavsiktliga ändringar efter att moms är deklarerad och betald.
                </p>
              </div>

              <div className="bg-slate-700/50 p-4 rounded-lg mb-4">
                <h5 className="font-semibold text-slate-100 mb-2">Sammanfattning</h5>
                <div className="space-y-1 text-sm text-slate-300">
                  <div className="flex justify-between">
                    <span>Period:</span>
                    <span className="font-medium">
                      {period === "all" ? `Hela ${year}` : `${period}/${year}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Moms att betala:</span>
                    <span className="font-medium">{formatSEK(momsAttBetala)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-medium text-green-400">Bokförd och betald</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Knapp text="← Tillbaka" onClick={() => setCurrentStep(4)} />
              <Knapp text="🔒 Stäng period" onClick={handleStepComplete} />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
