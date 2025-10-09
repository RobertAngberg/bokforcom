"use client";

import Knapp from "../../_components/Knapp";
import { formatSieDateToHtml } from "../utils/formatting";
import type { SieData, LocalImportSettings } from "../types/types";

export default function Steg2Forhandsvisning({
  sieData,
  settings,
  onNext,
  onBack,
}: {
  sieData: SieData;
  settings: LocalImportSettings;
  onNext: () => void;
  onBack: () => void;
}) {
  // Filtrera verifikationer baserat på datumintervall
  const filtradeVerifikationer = sieData.verifikationer.filter((v) => {
    const verifikationsDatum = formatSieDateToHtml(v.datum);

    if (settings.startDatum && verifikationsDatum < settings.startDatum) return false;
    if (settings.slutDatum && verifikationsDatum > settings.slutDatum) return false;
    return true;
  });

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-4 text-center">Steg 2: Förhandsvisning</h2>

      {/* Info om bilagor */}
      <div className="text-gray-300 px-4 py-3 mb-4 text-center">
        <div className="flex items-start space-x-2 justify-center">
          <span className="text-lg">ℹ️</span>
          <div>
            <strong>OBS:</strong> SIE-filer innehåller endast transaktionsdata. Verifikatbilagor
            (PDFer, bilder, kvitton) måste laddas upp separat efter importen.
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-4">
            📋 Sammanfattning: Följande kommer att importeras till din databas:
          </h3>
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
      </div>

      <div className="mt-6 flex justify-between">
        <Knapp text="← Ändra inställningar" onClick={onBack} />
        <Knapp text="Starta import!" onClick={onNext} />
      </div>
    </div>
  );
}
