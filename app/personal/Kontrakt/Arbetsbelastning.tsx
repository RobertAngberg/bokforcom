// #region Huvud
"use client";

import TextFalt from "../../_components/TextFalt";
import Dropdown from "../../_components/Dropdown";
import { ArbetsbelastningProps } from "../_types/types";

// #endregion

export default function Arbetsbelastning({
  editData,
  handleChange,
  anställd,
  viewMode,
  options,
  display,
}: ArbetsbelastningProps) {
  if (viewMode) {
    return (
      <div className="bg-slate-800 p-6 rounded-lg">
        <h3 className="text-xl font-semibold text-white mb-4">Arbetsbelastning</h3>
        <div className="space-y-3">
          {[
            ["Arbetsbelastning", display?.arbetsbelastningText],
            ["Arbetsvecka", display?.arbetsveckaText],
          ].map(([label, value]) => (
            <div key={label as string}>
              <span className="text-gray-400">{label}:</span>
              <div className="text-white">{(value as string) || "Ej angiven"}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 p-6 rounded-lg">
      <h3 className="text-xl font-semibold text-white mb-4">Arbetsbelastning</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Dropdown
          label="Arbetsbelastning"
          value={editData?.arbetsbelastning || ""}
          onChange={(value) => handleChange?.("arbetsbelastning", value)}
          options={options || []}
        />
        <TextFalt
          label="Arbetsvecka (timmar)"
          name="arbetsveckaTimmar"
          type="number"
          value={editData?.arbetsveckaTimmar || ""}
          onChange={(e) => handleChange?.("arbetsveckaTimmar", e.target.value)}
        />
        {editData?.arbetsbelastning === "Deltidsanställd" && (
          <TextFalt
            label="Deltid (%)"
            name="deltidProcent"
            type="number"
            value={editData?.deltidProcent || ""}
            onChange={(e) => handleChange?.("deltidProcent", e.target.value)}
          />
        )}
      </div>
    </div>
  );
}
