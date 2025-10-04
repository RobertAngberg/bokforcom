// #region Huvud
"use client";

import type { SemesterProps } from "../../../types/types";
// #endregion

export default function Semester({ anställd, viewMode }: SemesterProps) {
  if (!anställd) return null;

  // Beräkna semesterdagar baserat på anställningstyp och arbetsbelastning
  const getSemesterdagarPerÅr = () => {
    const arbetsbelastning = anställd?.arbetsbelastning || "";

    if (arbetsbelastning.includes("Heltid") || arbetsbelastning === "Heltidsanställd") {
      return "25 dagar";
    } else if (arbetsbelastning.includes("Deltid")) {
      const deltidProcent = anställd?.deltidProcent;
      if (deltidProcent) {
        const procent = parseInt(deltidProcent.toString());
        const dagar = Math.round((25 * procent) / 100);
        return `${dagar} dagar (${procent}% av 25)`;
      }
      return "Proportionellt efter arbetstid";
    }
    return "25 dagar (standard)";
  };

  if (viewMode) {
    return (
      <div className="bg-slate-800 p-6 rounded-lg">
        <h3 className="text-xl font-semibold text-white mb-4">Semester</h3>
        <div className="space-y-3">
          {[["Semesterdagar per år", getSemesterdagarPerÅr()]].map(([label, value]) => (
            <div key={label}>
              <span className="text-gray-400">{label}:</span>
              <div className="text-white">{value}</div>
            </div>
          ))}
          {anställd?.växaStöd && (
            <div>
              <span className="text-gray-400">VÄXA-stöd:</span>
              <div className="text-green-400">Ja</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 p-6 rounded-lg">
      <h3 className="text-xl font-semibold text-white mb-4">Semester</h3>
      <div className="space-y-3">
        <div>
          <span className="text-gray-400">Semesterdagar per år:</span>
          <div className="text-white">{getSemesterdagarPerÅr()}</div>
          <div className="text-sm text-gray-500 mt-1">
            Beräknas automatiskt baserat på arbetsbelastning
          </div>
        </div>
        {anställd?.växaStöd && (
          <div>
            <span className="text-gray-400">VÄXA-stöd:</span>
            <div className="text-green-400">Ja</div>
          </div>
        )}
      </div>
    </div>
  );
}
