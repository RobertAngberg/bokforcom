"use client";

import React, { useState } from "react";
import LönespecView from "../Lonespecar/LonespecView";
import Knapp from "../../_components/Knapp";

interface LonespecListaProps {
  valdaSpecar: any[];
  anstallda: any[];
  utlaggMap: Record<number, any[]>;
  lönekörning?: any; // Lägg till lönekörning-objektet
  onTaBortSpec: (specId: number) => Promise<void>;
  onHämtaBankgiro: () => void;
  onMailaSpecar: () => void;
  onBokför: () => void;
  onGenereraAGI: () => void;
  onBokförSkatter: () => void;
  onRefreshData?: () => Promise<void>; // Ny callback för att refresha data
  period?: string; // Lägg till period för lönekörning
}

export default function LonespecLista({
  valdaSpecar,
  anstallda,
  utlaggMap,
  lönekörning,
  onTaBortSpec,
  onHämtaBankgiro,
  onMailaSpecar,
  onBokför,
  onGenereraAGI,
  onBokförSkatter,
  onRefreshData,
  period,
}: LonespecListaProps) {
  const [taBortLaddning, setTaBortLaddning] = useState<Record<number, boolean>>({});

  // Använd aktuellt_steg från databasen istället för lokal state
  const currentStep = lönekörning?.aktuellt_steg || 0; // Börja med 0 istället för 1
  const mailaEnabled = currentStep >= 1;
  const bokförEnabled = currentStep >= 2;
  const agiEnabled = currentStep >= 3;
  const skatterEnabled = currentStep >= 4;

  // Hämta lönekörning när komponenten laddas eller period ändras
  // REMOVED - för enkelhet

  if (valdaSpecar.length === 0) return null;

  // Kontrollera om alla lönespecar har genomfört en viss åtgärd
  const allaHarBankgiro = valdaSpecar.every((spec) => spec.bankgiro_exporterad);
  const allaHarMailats = valdaSpecar.every((spec) => spec.mailad);
  const allaHarBokförts = valdaSpecar.every((spec) => spec.bokförd);
  const allaHarAGI = valdaSpecar.every((spec) => spec.agi_genererad);
  const allaHarSkatter = valdaSpecar.every((spec) => spec.skatter_bokförda);

  const handleTaBortLönespec = async (spec: any) => {
    if (!confirm("Är du säker på att du vill ta bort denna lönespecifikation?")) return;
    setTaBortLaddning((prev) => ({ ...prev, [spec.id]: true }));
    try {
      await onTaBortSpec(spec.id);
    } catch (error) {
      console.error("❌ Fel vid borttagning av lönespec:", error);
      // REMOVED toast för enkelhet
    } finally {
      setTaBortLaddning((prev) => ({ ...prev, [spec.id]: false }));
    }
  };

  // SUPERENKLA wrapper-funktioner
  const handleHämtaBankgiro = () => {
    onHämtaBankgiro();
  };

  const handleBokför = () => {
    console.log("🔥 handleBokför anropad!");
    onBokför();
    // Ta bort setAgiEnabled - steg uppdateras nu i databasen
  };

  const handleGenereraAGI = () => {
    onGenereraAGI();
    // Ta bort setSkatterEnabled - steg uppdateras nu i databasen
  };

  const handleBokförSkatter = () => {
    onBokförSkatter();
  };

  return (
    <div className="space-y-2">
      {/* Workflow validation warning */}
      {valdaSpecar.some((spec) => !spec.bruttolön || !spec.nettolön) && (
        <div className="bg-yellow-600 p-3 rounded text-white text-center mb-4">
          ⚠️ Kontrollera att alla lönespecar är kompletta innan du startar lönekörningen!
        </div>
      )}

      {/* Lönekörnings-workflow - SIE Wizard Style */}
      <div className="bg-slate-700 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h5 className="text-white font-semibold">Lönekörnings-workflow</h5>
          {/* REMOVED lönekörning info för enkelhet */}
        </div>

        {/* Progress Steps - SIE Style */}
        <div className="flex items-center space-x-4 mb-6">
          {[
            {
              id: "maila",
              title: "Maila",
              description: "Skicka lönespecar",
              completed: !!lönekörning?.mailade_datum,
            },
            {
              id: "bokfor",
              title: "Bokför",
              description: "Registrera i bokföring",
              completed: !!lönekörning?.bokford_datum,
            },
            {
              id: "agi",
              title: "AGI",
              description: "Generera deklaration",
              completed: !!lönekörning?.agi_genererad_datum,
            },
            {
              id: "skatter",
              title: "Skatter",
              description: "Bokför skatter",
              completed: !!lönekörning?.skatter_bokforda_datum,
            },
          ].map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`w-8 h-8 min-w-[2rem] rounded-full flex items-center justify-center text-sm font-bold ${
                  step.completed ? "bg-green-600 text-white" : "bg-slate-600 text-gray-400"
                }`}
              >
                {step.completed ? "✓" : index + 1}
              </div>
              <div className="ml-2">
                <div
                  className={`text-sm font-medium ${
                    step.completed ? "text-white" : "text-gray-400"
                  }`}
                >
                  {step.title}
                </div>
                <div className="text-xs text-gray-500">{step.description}</div>
              </div>
              {index < 3 && (
                <div
                  className={`w-8 h-0.5 mx-4 ${step.completed ? "bg-green-600" : "bg-slate-600"}`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lönespecar */}
      <>
        {valdaSpecar.map((spec) => {
          const anstalld = anstallda.find((a) => a.id === spec.anställd_id);
          const utlagg = anstalld ? utlaggMap[anstalld.id] || [] : [];

          return (
            <LönespecView
              key={spec.id}
              lönespec={spec}
              anställd={anstalld}
              utlägg={utlagg}
              ingenAnimering={false}
              taBortLoading={taBortLaddning[spec.id] || false}
              visaExtraRader={true}
              onTaBortLönespec={() => handleTaBortLönespec(spec)}
            />
          );
        })}
      </>

      {/* Bankgiro export - separate från workflow */}
      <div className="bg-slate-800 rounded-lg p-4">
        <div className="text-center">
          <Knapp
            text="🏦 Hämta bankgirofil"
            onClick={handleHämtaBankgiro}
            className="bg-blue-600 hover:bg-blue-700"
          />
          <p className="text-gray-400 text-sm mt-2">
            Exportera betalningsfil för banken (frivilligt)
          </p>
        </div>
      </div>

      {/* Action buttons - SUPERENKLA */}
      <div className="bg-slate-700 rounded-lg p-6">
        <h5 className="text-white font-semibold mb-4 text-center">Lönekörnings-åtgärder</h5>
        <div className="flex gap-4 justify-center flex-wrap">
          <Knapp
            text="✉️ Maila lönespecar"
            onClick={onMailaSpecar}
            className="bg-blue-600 hover:bg-blue-700"
          />
          <Knapp
            text="📖 Bokför"
            onClick={handleBokför}
            className={
              bokförEnabled ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-500 cursor-not-allowed"
            }
            disabled={!bokförEnabled}
          />
          <Knapp
            text="📊 Generera AGI"
            onClick={handleGenereraAGI}
            className={
              agiEnabled ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-500 cursor-not-allowed"
            }
            disabled={!agiEnabled}
          />
          <Knapp
            text="💰 Bokför skatter"
            onClick={handleBokförSkatter}
            className={
              skatterEnabled ? "bg-cyan-600 hover:bg-cyan-700" : "bg-gray-500 cursor-not-allowed"
            }
            disabled={!skatterEnabled}
          />
        </div>

        {/* Completion status */}
        {allaHarSkatter && (
          <div className="mt-6 p-6 bg-gradient-to-r from-green-500 to-green-600 rounded-lg text-center shadow-lg">
            <div className="text-white text-xl font-bold mb-2">🎉 LÖNEKÖRNING AVSLUTAD!</div>
            <div className="text-green-100 text-sm">
              Alla steg har genomförts framgångsrikt. Lönekörningen är nu komplett.
            </div>
          </div>
        )}
      </div>

      {/* REMOVED toast för enkelhet */}
    </div>
  );
}
