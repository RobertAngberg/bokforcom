"use client";

import { useState } from "react";
import LönespecView from "../Lonespecar/LonespecView";
import Knapp from "../../_components/Knapp";
import Toast from "../../_components/Toast";
import AnimeradFlik from "../../_components/AnimeradFlik";
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

      {/* Lönekörningsåtgärder sektion - FLYTTAD HIT */}
      <AnimeradFlik title="Lönekörningsåtgärder" icon="⚙️" forcedOpen={true}>
        <div className="bg-slate-700 p-4 rounded-lg">
          <div className="flex gap-4 justify-center flex-wrap">
            <Knapp
              text={allaHarBankgiro ? "✅ Bankgirofil exporterad" : "🏦 Hämta bankgirofil"}
              onClick={handleHämtaBankgiro}
              className={allaHarBankgiro ? "bg-green-600 hover:bg-green-700" : ""}
            />
            <Knapp
              text={allaHarMailats ? "✅ Lönespecar mailade" : "✉️ Maila lönespecar"}
              onClick={handleMailaSpecar}
              className={allaHarMailats ? "bg-green-600 hover:bg-green-700" : ""}
            />
            <Knapp
              text={allaHarBokförts ? "✅ Löner bokförda" : "📖 Bokför"}
              onClick={handleBokför}
              className={allaHarBokförts ? "bg-green-600 hover:bg-green-700" : ""}
            />
            <Knapp
              text={allaHarAGI ? "✅ AGI genererad" : "📊 Generera AGI"}
              onClick={handleGenereraAGI}
              className={allaHarAGI ? "bg-green-600 hover:bg-green-700" : ""}
            />
            <Knapp
              text={allaHarSkatter ? "✅ Skatter bokförda" : "💰 Bokför skatter"}
              onClick={handleBokförSkatter}
              className={allaHarSkatter ? "bg-green-600 hover:bg-green-700" : ""}
            />
          </div>
        </div>
      </AnimeradFlik>

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
