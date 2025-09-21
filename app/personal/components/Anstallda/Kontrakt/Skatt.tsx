// #region Huvud
"use client";

import Dropdown from "../../../../_components/Dropdown";
import type { SkattProps } from "../../../types/types";
// #endregion

export default function Skatt({ editData, handleChange, anställd, viewMode, options }: SkattProps) {
  if (viewMode) {
    return (
      <div className="bg-slate-800 p-6 rounded-lg">
        <h3 className="text-xl font-semibold text-white mb-4">Skatt</h3>
        <div className="space-y-3">
          {[
            ["Skattetabell", anställd.skattetabell ? `Tabell ${anställd.skattetabell}` : null],
            ["Skattekolumn", anställd.skattekolumn ? `Kolumn ${anställd.skattekolumn}` : null],
          ].map(([label, value]) => (
            <div key={label}>
              <span className="text-gray-400">{label}:</span>
              <div className="text-white">{value || "Ej angiven"}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 p-6 rounded-lg">
      <h3 className="text-xl font-semibold text-white mb-4">Skatt</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Dropdown
          label="Skattetabell"
          value={editData.skattetabell || ""}
          onChange={(value) => handleChange?.("skattetabell", value)}
          options={options?.skattetabell || []}
        />
        <Dropdown
          label="Skattekolumn"
          value={editData.skattekolumn || ""}
          onChange={(value) => handleChange?.("skattekolumn", value)}
          options={options?.skattekolumn || []}
        />
      </div>
    </div>
  );
}
