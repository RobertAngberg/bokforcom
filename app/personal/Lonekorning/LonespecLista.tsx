"use client";

import { useState } from "react";
import LönespecView from "../Lonespecar/LonespecView";
import Knapp from "../../_components/Knapp";
import Toast from "../../_components/Toast";
import {
  markeraBankgiroExporterad,
  markeraMailad,
  markeraBokförd,
  markeraAGIGenererad,
  markeraSkatternaBokförda,
} from "../actions";

interface LonespecListaProps {
  valdaSpecar: any[];
  anstallda: any[];
  utlaggMap: Record<number, any[]>;
  onTaBortSpec: (specId: number) => Promise<void>;
  onHämtaBankgiro: () => void;
  onMailaSpecar: () => void;
  onBokför: () => void;
  onGenereraAGI: () => void;
  onBokförSkatter: () => void;
  onRefreshData?: () => Promise<void>; // Ny callback för att refresha data
}

export default function LonespecLista({
  valdaSpecar,
  anstallda,
  utlaggMap,
  onTaBortSpec,
  onHämtaBankgiro,
  onMailaSpecar,
  onBokför,
  onGenereraAGI,
  onBokförSkatter,
  onRefreshData,
}: LonespecListaProps) {
  const [taBortLaddning, setTaBortLaddning] = useState<Record<number, boolean>>({});
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

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
      setToast({ type: "error", message: "Kunde inte ta bort lönespec" });
    } finally {
      setTaBortLaddning((prev) => ({ ...prev, [spec.id]: false }));
    }
  };

  // Wrapper-funktioner som markerar åtgärder som klara
  const handleHämtaBankgiro = async () => {
    // Bara öppna modalen - markering sker i BankgiroExport när filen laddas ner
    onHämtaBankgiro();
  };

  const handleMailaSpecar = async () => {
    // Bara öppna modalen - markering sker när mail faktiskt skickas
    onMailaSpecar();
  };

  const handleBokför = async () => {
    // Bara öppna modalen - markering sker när bokföringen faktiskt genomförs
    onBokför();
  };

  const handleGenereraAGI = async () => {
    // Bara öppna modalen - markering sker när AGI faktiskt genereras
    onGenereraAGI();
  };

  const handleBokförSkatter = async () => {
    // Bara öppna modalen - markering sker när skatterna faktiskt bokförs
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
        <h5 className="text-white font-semibold mb-4">Lönekörnings-workflow</h5>

        {/* Progress Steps - SIE Style */}
        <div className="flex items-center space-x-4 mb-6">
          {[
            {
              id: "bankgiro",
              title: "Bankgiro",
              description: "Exportera utbetalningsfil",
              completed: allaHarBankgiro,
            },
            {
              id: "maila",
              title: "Maila",
              description: "Skicka lönespecar",
              completed: allaHarMailats,
            },
            {
              id: "bokfor",
              title: "Bokför",
              description: "Registrera i bokföring",
              completed: allaHarBokförts,
            },
            { id: "agi", title: "AGI", description: "Generera deklaration", completed: allaHarAGI },
            {
              id: "skatter",
              title: "Skatter",
              description: "Bokför skatter",
              completed: allaHarSkatter,
            },
          ].map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`w-8 h-8 min-w-[2rem] rounded-full flex items-center justify-center text-sm font-bold ${
                  step.completed
                    ? "bg-green-600 text-white"
                    : index === 0 ||
                        (index === 1 && allaHarBankgiro) ||
                        (index === 2 && allaHarMailats) ||
                        (index === 3 && allaHarBokförts) ||
                        (index === 4 && allaHarAGI)
                      ? "bg-cyan-600 text-white"
                      : "bg-slate-600 text-gray-400"
                }`}
              >
                {step.completed ? "✓" : index + 1}
              </div>
              <div className="ml-2">
                <div
                  className={`text-sm font-medium ${
                    step.completed ||
                    index === 0 ||
                    (index === 1 && allaHarBankgiro) ||
                    (index === 2 && allaHarMailats) ||
                    (index === 3 && allaHarBokförts) ||
                    (index === 4 && allaHarAGI)
                      ? "text-white"
                      : "text-gray-400"
                  }`}
                >
                  {step.title}
                </div>
                <div className="text-xs text-gray-500">{step.description}</div>
              </div>
              {index < 4 && (
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

      {/* Action buttons with validation */}
      <div className="bg-slate-700 rounded-lg p-6">
        <h5 className="text-white font-semibold mb-4 text-center">Lönekörnings-åtgärder</h5>
        <div className="flex gap-4 justify-center flex-wrap">
          <Knapp
            text={allaHarBankgiro ? "✅ Bankgirofil exporterad" : "🏦 Hämta bankgirofil"}
            onClick={handleHämtaBankgiro}
            className={allaHarBankgiro ? "bg-green-600 hover:bg-green-700" : ""}
          />
          <Knapp
            text={allaHarMailats ? "✅ Lönespecar mailade" : "✉️ Maila lönespecar"}
            onClick={
              allaHarBankgiro ? handleMailaSpecar : () => alert("⚠️ Exportera bankgirofil först!")
            }
            className={
              allaHarMailats
                ? "bg-green-600 hover:bg-green-700"
                : !allaHarBankgiro
                  ? "bg-gray-500 cursor-not-allowed"
                  : ""
            }
            disabled={!allaHarBankgiro}
          />
          <Knapp
            text={allaHarBokförts ? "✅ Löner bokförda" : "📖 Bokför"}
            onClick={allaHarMailats ? handleBokför : () => alert("⚠️ Skicka lönespecar först!")}
            className={
              allaHarBokförts
                ? "bg-green-600 hover:bg-green-700"
                : !allaHarMailats
                  ? "bg-gray-500 cursor-not-allowed"
                  : ""
            }
            disabled={!allaHarMailats}
          />
          <Knapp
            text={allaHarAGI ? "✅ AGI genererad" : "📊 Generera AGI"}
            onClick={allaHarBokförts ? handleGenereraAGI : () => alert("⚠️ Bokför löner först!")}
            className={
              allaHarAGI
                ? "bg-green-600 hover:bg-green-700"
                : !allaHarBokförts
                  ? "bg-gray-500 cursor-not-allowed"
                  : ""
            }
            disabled={!allaHarBokförts}
          />
          <Knapp
            text={allaHarSkatter ? "✅ Skatter bokförda" : "💰 Bokför skatter"}
            onClick={allaHarAGI ? handleBokförSkatter : () => alert("⚠️ Generera AGI först!")}
            className={
              allaHarSkatter
                ? "bg-green-600 hover:bg-green-700"
                : !allaHarAGI
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-cyan-600 hover:bg-cyan-700"
            }
            disabled={!allaHarAGI}
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

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          isVisible={true}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
