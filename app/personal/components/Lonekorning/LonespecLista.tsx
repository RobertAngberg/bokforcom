"use client";

import React, { useState } from "react";
import LönespecView from "../Anstallda/Lonespecar/LonespecView";
import Knapp from "../../../_components/Knapp";
import { LonespecListaProps } from "../../types/types";

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

  // Kolla om lönekörningen är komplett (alla steg genomförda på lönekörning-nivå)
  const lönekörningKomplett = !!(
    lönekörning?.mailade_datum &&
    lönekörning?.bokford_datum &&
    lönekörning?.agi_genererad_datum &&
    lönekörning?.skatter_bokforda_datum
  );

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

      {/* Extra spacing */}
      <div className="h-4"></div>

      {/* Lönekörnings-workflow */}
      <div className="bg-slate-700 rounded-lg p-6">
        {/* Progress Steps - Integrerad med knappar */}
        <div className="space-y-4 mb-6">
          {[
            {
              id: "maila",
              title: "Maila",
              description: "Skicka lönespecar",
              completed: !!lönekörning?.mailade_datum,
              buttonText: "✉️ Maila lönespecar",
              onClick: onMailaSpecar,
              enabled: true, // Första steget är alltid enabled
            },
            {
              id: "bokfor",
              title: "Bokför",
              description: "Registrera i bokföring",
              completed: !!lönekörning?.bokford_datum,
              buttonText: "📖 Bokför",
              onClick: handleBokför,
              enabled: !!lönekörning?.bokford_datum || !!lönekörning?.mailade_datum, // Enabled om klart ELLER om föregående steg är klart
            },
            {
              id: "agi",
              title: "AGI",
              description: "Generera deklaration",
              completed: !!lönekörning?.agi_genererad_datum,
              buttonText: "📊 Generera AGI",
              onClick: handleGenereraAGI,
              enabled: !!lönekörning?.agi_genererad_datum || !!lönekörning?.bokford_datum, // Enabled om klart ELLER om föregående steg är klart
            },
            {
              id: "skatter",
              title: "Skatter",
              description: "Bokför skatter",
              completed: !!lönekörning?.skatter_bokforda_datum,
              buttonText: "💰 Bokför skatter",
              onClick: handleBokförSkatter,
              enabled: !!lönekörning?.skatter_bokforda_datum || !!lönekörning?.agi_genererad_datum, // Enabled om klart ELLER om föregående steg är klart
            },
          ].map((step, index) => (
            <div
              key={step.id}
              className="flex items-center justify-between bg-slate-600 rounded-lg p-4"
            >
              {/* Vänster sida: Status och info */}
              <div className="flex items-center">
                <div
                  className={`w-8 h-8 min-w-[2rem] rounded-full flex items-center justify-center text-sm font-bold mr-4 ${
                    step.completed ? "bg-green-600 text-white" : "bg-slate-500 text-gray-300"
                  }`}
                >
                  {step.completed ? "✓" : index + 1}
                </div>
                <div>
                  <div
                    className={`text-sm font-medium ${
                      step.completed ? "text-green-400" : "text-white"
                    }`}
                  >
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-400 flex items-center gap-2">
                    {step.description}
                    {step.id === "agi" && (
                      <a
                        href="https://www.skatteverket.se/foretagochorganisationer/arbetsgivare/nyttlamnaarbetsgivardeklarationpaindividniva.4.41f1c61d16193087d7fcaeb.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline ml-2"
                      >
                        Länk till Skatteverket
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Höger sida: Knapp */}
              <div>
                <Knapp
                  text={step.buttonText}
                  onClick={step.onClick}
                  className={
                    step.enabled
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-gray-500 cursor-not-allowed"
                  }
                  disabled={!step.enabled}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Frivilliga åtgärder - REMOVED bankgiro, moved to skatte modal */}
      {/* <div className="bg-slate-700 rounded-lg p-6">
        <h5 className="text-white font-semibold mb-4 text-center">Frivilliga åtgärder</h5>
        <div className="flex gap-4 justify-center flex-wrap">
          <Knapp
            text="🏦 Bankgirofil (Frivilligt)"
            onClick={handleHämtaBankgiro}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={false}
          />
        </div>
      </div> */}

      {/* Completion status */}
      {lönekörningKomplett && (
        <div className="mt-6 p-6 bg-slate-600 rounded-lg text-center shadow-lg">
          <div className="text-white text-xl font-bold mb-2">🎉 Lönekörning avslutad</div>
          <div className="text-gray-300 text-sm">
            Alla steg har genomförts framgångsrikt. Lönekörningen är nu komplett.
          </div>
        </div>
      )}
    </div>
  );
}
