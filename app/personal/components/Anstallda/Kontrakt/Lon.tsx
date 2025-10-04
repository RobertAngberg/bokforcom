// #region Huvud
"use client";

import TextFalt from "../../../../_components/TextFalt";
import Dropdown from "../../../../_components/Dropdown";
import type { LönProps } from "../../../types/types";
// #endregion

export default function Lön({ editData, handleChange, anställd, viewMode, options }: LönProps) {
  if (viewMode) {
    return (
      <div className="bg-slate-800 p-6 rounded-lg">
        <h3 className="text-xl font-semibold text-white mb-4">Lön</h3>
        <div className="space-y-3">
          {[
            ["Kompensation", anställd?.kompensation ? `${anställd.kompensation} kr` : null],
            ["Ersättning per", anställd?.ersättningPer],
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
      <h3 className="text-xl font-semibold text-white mb-4">Lön</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TextFalt
          label="Kompensation (kr)"
          name="kompensation"
          type="number"
          value={editData?.kompensation || ""}
          onChange={(e) => handleChange?.("kompensation", e.target.value)}
        />
        <Dropdown
          label="Ersättning per"
          value={editData?.ersättningPer || ""}
          onChange={(value) => handleChange?.("ersättningPer", value)}
          options={options?.ersättningPer || []}
        />
      </div>
    </div>
  );
}
