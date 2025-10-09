"use client";

import type { SieData, Analys } from "../types/types";

interface SieDataHeaderProps {
  sieData: SieData;
  analys: Analys | null;
  saknadeKonton: string[];
  visaSaknade: boolean;
  setVisaSaknade: (value: boolean) => void;
}

export default function SieDataHeader({
  sieData,
  analys,
  saknadeKonton,
  visaSaknade,
  setVisaSaknade,
}: SieDataHeaderProps) {
  return (
    <div className="mb-6 bg-slate-700 rounded-lg p-6">
      <h2 className="text-3xl text-white mb-10 text-center">Import av bokföringsdata</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white">
        <div>
          <strong>Program:</strong> {sieData.header.program}
        </div>
        <div>
          <strong>Organisationsnummer:</strong> {sieData.header.organisationsnummer}
        </div>
        <div>
          <strong>Företagsnamn:</strong> {sieData.header.företagsnamn}
        </div>
        <div>
          <strong>Kontoplan:</strong> {sieData.header.kontoplan}
        </div>
      </div>

      {/* Varning för saknade konton */}
      {analys && (analys.specialKonton > 0 || analys.kritiskaKonton.length > 0) && (
        <div className="mt-4 space-y-2">
          {/* Info om kontoanalys */}
          <div className="text-gray-300 px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <strong>ℹ️ Kontoanalys:</strong> SIE-filen innehåller {analys.totaltAntal} konton
                från hela BAS-kontoplanen.{" "}
                {saknadeKonton.length > 0
                  ? `${saknadeKonton.length} specialkonto behöver granskas.`
                  : "Alla använda konton finns redan i din kontoplan."}
              </div>
              {saknadeKonton.length > 0 && (
                <button
                  onClick={() => setVisaSaknade(!visaSaknade)}
                  className="ml-4 underline hover:no-underline text-sm"
                >
                  {visaSaknade ? "Dölj specialkonton" : "Visa specialkonton"} →
                </button>
              )}
            </div>

            {/* Expanderbar lista med saknade konton */}
            {visaSaknade && saknadeKonton.length > 0 && (
              <div className="mt-4 pt-4 border-t border-blue-400/30">
                <h4 className="font-semibold text-blue-300 mb-3">
                  Specialkonton som saknas ({saknadeKonton.length} st)
                </h4>
                <p className="text-blue-300 text-sm mb-3">
                  Dessa konton är inte BAS-standardkonton och bör granskas:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                  {saknadeKonton.map((kontonummer) => {
                    const kontoInfo = sieData?.konton.find((k) => k.nummer === kontonummer);
                    return (
                      <div key={kontonummer} className="bg-blue-900/30 rounded-lg p-2">
                        <div className="text-sm font-bold text-blue-200">{kontonummer}</div>
                        {kontoInfo && (
                          <div className="text-blue-300 text-xs mt-1">{kontoInfo.namn}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Kritiska konton varning - behåll denna */}
          {analys.kritiskaKonton.length > 0 && (
            <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded">
              <strong>🚨 Kritisk:</strong> {analys.kritiskaKonton.length} kritiska företagsspecifika
              konton saknas som behöver skapas för korrekt import.
            </div>
          )}

          {/* Info om standardkonton */}
          {analys.standardKonton > 0 && (
            <div className="text-gray-300 px-4 py-3">
              <strong>ℹ️ Info:</strong> {analys.standardKonton} BAS-standardkonton hittades som inte
              finns i din kontoplan (detta är normalt).
            </div>
          )}
        </div>
      )}
    </div>
  );
}
