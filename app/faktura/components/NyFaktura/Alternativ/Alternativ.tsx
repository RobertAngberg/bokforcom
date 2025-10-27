//#region Huvud
"use client";

import Knapp from "../../../../_components/Knapp";
import ExporteraPDFKnapp from "./ExporteraPDFKnapp";
import SkickaEpost from "./SkickaEpost";
import BokforFakturaModal from "./BokforFakturaModal";
import { useAlternativ } from "../../../hooks/useAlternativ";
import { AlternativProps } from "../../../types/types";

export default function Alternativ({ onPreview }: AlternativProps) {
  const {
    // State
    bokförModalOpen,
    sparaLoading,
    bokförLoading,
    doljBokförKnapp,
    sparaKnappText,
    bokförKnappText,
    statusLoading,
    granskKnappText,
    pdfKnappText,

    // Actions
    setBokförModalOpen,
    hanteraSpara,
    hanteraBokför,
  } = useAlternativ();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4">
        <Knapp
          onClick={() => {
            console.log("🔍 Spara-knapp klickad!", {
              sparaLoading,
            });
            hanteraSpara();
          }}
          text={sparaKnappText}
          disabled={sparaLoading}
          className="flex-1 min-w-40"
        />
        <Knapp onClick={onPreview} text={granskKnappText} className="flex-1 min-w-40" />
        <div className="flex-1 min-w-40">
          <ExporteraPDFKnapp text={pdfKnappText} className="w-full" />
        </div>
        {!doljBokförKnapp && (
          <div className="flex-1 min-w-40">
            <Knapp
              onClick={hanteraBokför}
              text={bokförKnappText}
              disabled={bokförLoading || statusLoading}
              loading={statusLoading}
              loadingText="Hämtar status..."
              className="w-full"
            />
          </div>
        )}
      </div>
      <SkickaEpost
        onSuccess={() => console.log("E-post skickad")}
        onError={(err) => console.error("E-postfel:", err)}
      />

      <BokforFakturaModal isOpen={bokförModalOpen} onClose={() => setBokförModalOpen(false)} />
    </div>
  );
}
