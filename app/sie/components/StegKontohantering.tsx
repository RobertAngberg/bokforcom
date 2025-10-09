"use client";

import Knapp from "../../_components/Knapp";
import type { SieData, Analys } from "../types/types";

export default function StegKontohantering({
  sieData,
  saknadeKonton,
  analys,
  onNext,
}: {
  sieData: SieData;
  saknadeKonton: string[];
  analys: Analys;
  onNext: () => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-4">Steg 1: Kontohantering</h2>

      <div className="space-y-4">
        {/* Info om automatisk kontoskapande */}
        <div className="bg-blue-500/20 border border-blue-500 text-blue-400 px-4 py-3 rounded">
          <strong>ℹ️ Smart kontoskapande:</strong> Systemet kommer automatiskt att skapa ALLA
          använda konton som saknas i din kontoplan, inklusive både BAS-standardkonton och
          företagsspecifika konton.
        </div>

        {saknadeKonton.length > 0 ? (
          <div className="space-y-4">
            <div className="bg-yellow-500/20 border border-yellow-500 text-yellow-400 px-4 py-3 rounded">
              <strong>⚠️ Specialkonton att granska:</strong> {saknadeKonton.length}{" "}
              företagsspecifika konton hittades som bör granskas innan import.
            </div>

            <div className="bg-slate-800 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-3">
                Företagsspecifika konton som kommer att skapas:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {saknadeKonton.map((kontonummer) => {
                  const kontoInfo = sieData.konton.find((k) => k.nummer === kontonummer);
                  return (
                    <div key={kontonummer} className="bg-slate-700 rounded-lg p-3">
                      <div className="text-lg font-bold text-white">{kontonummer}</div>
                      {kontoInfo && (
                        <div className="text-gray-300 text-sm mt-1">{kontoInfo.namn}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-green-500/20 border border-green-500 text-green-400 px-4 py-3 rounded">
            ✅ Inga företagsspecifika konton behöver granskas!
          </div>
        )}

        {/* Info om övriga konton */}
        {analys.anvandaSaknade > saknadeKonton.length && (
          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="font-semibold text-white mb-2">📊 Ytterligare kontoskapande</h3>
            <p className="text-gray-300 text-sm">
              Totalt kommer {analys.anvandaSaknade} använda konton att skapas, varav{" "}
              {analys.anvandaSaknade - saknadeKonton.length} är BAS-standardkonton som skapas
              automatiskt utan granskning.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <Knapp text="Fortsätt till inställningar →" onClick={onNext} />
      </div>
    </div>
  );
}
