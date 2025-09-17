// #region Huvud
"use client";

import TextFalt from "../../_components/TextFalt";
import type { SemesterProps } from "../_types/types";
// #endregion

export default function Semester({ editData, handleChange, anställd, viewMode }: SemesterProps) {
  if (viewMode) {
    return (
      <div className="bg-slate-800 p-6 rounded-lg">
        <h3 className="text-xl font-semibold text-white mb-4">Semester</h3>
        <div className="space-y-3">
          {[["Semesterdagar per år", anställd.semesterdagar_per_år]].map(([label, value]) => (
            <div key={label}>
              <span className="text-gray-400">{label}:</span>
              <div className="text-white">{value || "Ej angiven"}</div>
            </div>
          ))}
          {anställd.växa_stöd && (
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TextFalt
          label="Semesterdagar per år"
          name="semesterdagarPerÅr"
          type="number"
          value={editData.semesterdagarPerÅr || ""}
          onChange={(e) => handleChange?.("semesterdagarPerÅr", e.target.value)}
        />
      </div>
    </div>
  );
}
