// #region Huvud
"use client";

import Dropdown from "../../_components/Dropdown";
import { AnställningstypProps } from "../_types/types";

// #endregion

export default function Anställningstyp({
  editData,
  handleChange,
  anställd,
  viewMode,
  options,
}: AnställningstypProps) {
  if (viewMode) {
    return (
      <div className="bg-slate-800 p-6 rounded-lg">
        <h3 className="text-xl font-semibold text-white mb-4">Anställningstyp</h3>
        <div className="space-y-3">
          <div>
            <span className="text-gray-400">Anställningstyp:</span>
            <div className="text-white">{anställd?.anställningstyp || "Ej angiven"}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 p-6 rounded-lg">
      <h3 className="text-xl font-semibold text-white mb-4">Anställningstyp</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Dropdown
          label="Anställningstyp"
          value={editData?.anställningstyp || ""}
          onChange={(value) => handleChange?.("anställningstyp", value)}
          options={options || []}
        />
      </div>
    </div>
  );
}
