"use client";

import Knapp from "../../_components/Knapp";
import type { SieData, LocalImportSettings, DublettResultatSimple } from "../types/types";

export default function Steg1Installningar({
  sieData,
  settings,
  onSettingsChange,
  onNext,
  onBack,
  rensarDubbletter,
  dublettResultat,
  harDubbletter,
  onRensaDubbletter,
}: {
  sieData: SieData;
  settings: LocalImportSettings;
  onSettingsChange: (settings: LocalImportSettings) => void;
  onNext: () => void;
  onBack?: () => void;
  rensarDubbletter?: boolean;
  dublettResultat?: DublettResultatSimple | null;
  harDubbletter?: boolean;
  onRensaDubbletter?: () => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-4 text-center">
        Steg 1: Importinställningar
      </h2>

      <div className="space-y-6">
        {/* Dubbletthantering */}
        {harDubbletter && (
          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="font-semibold text-white mb-3">Dubbletthantering</h3>
            <div className="bg-orange-500/20 border border-orange-500 text-orange-400 px-4 py-3 rounded mb-3">
              <strong>⚠️ Dubbletter hittades i kontoplanen</strong>
              <br />
              <span className="text-sm">
                Det finns dubbletter av vissa konton. Klicka nedan för att rensa dem automatiskt.
              </span>
            </div>

            <div className="flex gap-2">
              <Knapp
                text={rensarDubbletter ? "Rensar..." : "🗑️ Rensa dubbletter"}
                onClick={onRensaDubbletter}
                disabled={rensarDubbletter}
                className="bg-orange-600 hover:bg-orange-700"
              />
            </div>

            {dublettResultat && (
              <div
                className={`p-3 rounded mt-3 ${
                  dublettResultat.success
                    ? "bg-green-500/20 border border-green-500 text-green-400"
                    : "bg-red-500/20 border border-red-500 text-red-400"
                }`}
              >
                {dublettResultat.success
                  ? `✅ Rensade ${dublettResultat.rensade} dubbletter`
                  : `❌ Fel: ${dublettResultat.error}`}
              </div>
            )}
          </div>
        )}

        {/* Datumintervall */}
        <div className="bg-slate-800 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-3">Datumintervall</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Från datum</label>
              <input
                type="date"
                value={settings.startDatum}
                onChange={(e) => onSettingsChange({ ...settings, startDatum: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Till datum</label>
              <input
                type="date"
                value={settings.slutDatum}
                onChange={(e) => onSettingsChange({ ...settings, slutDatum: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Vad som ska importeras */}
        <div className="bg-slate-800 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-3">Vad ska importeras?</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.inkluderaVerifikationer}
                onChange={(e) =>
                  onSettingsChange({ ...settings, inkluderaVerifikationer: e.target.checked })
                }
                className="mr-3"
              />
              <span className="text-white">
                Verifikationer ({sieData.verifikationer.length} st)
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.inkluderaBalanser}
                onChange={(e) =>
                  onSettingsChange({ ...settings, inkluderaBalanser: e.target.checked })
                }
                className="mr-3"
              />
              <span className="text-white">Ingående/Utgående balanser</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.inkluderaResultat}
                onChange={(e) =>
                  onSettingsChange({ ...settings, inkluderaResultat: e.target.checked })
                }
                className="mr-3"
              />
              <span className="text-white">Resultatdata</span>
            </label>
          </div>
        </div>

        {/* Avancerade inställningar */}
        <div className="bg-slate-800 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-3">Avancerade inställningar</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.skapaKonton}
                onChange={(e) => onSettingsChange({ ...settings, skapaKonton: e.target.checked })}
                className="mr-3"
              />
              <span className="text-white">Skapa saknade konton automatiskt</span>
            </label>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        {onBack && <Knapp text="← Tillbaka" onClick={onBack} />}
        <Knapp text="Fortsätt till förhandsvisning →" onClick={onNext} />
      </div>
    </div>
  );
}
