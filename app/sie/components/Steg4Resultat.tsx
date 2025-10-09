"use client";

import Knapp from "../../_components/Knapp";
import type { ImportResultatWizard } from "../types/types";

export default function Steg4Resultat({
  resultat,
  onFinish,
}: {
  resultat: ImportResultatWizard | null;
  onFinish: () => void;
}) {
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

        <Knapp fullWidth text="Tillbaka till SIE-import" onClick={onFinish} />
      </div>
    </div>
  );
}
