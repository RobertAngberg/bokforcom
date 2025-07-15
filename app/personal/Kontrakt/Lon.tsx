// #region Huvud
"use client";

import TextFält from "../../_components/TextFält";
import Dropdown from "../../_components/Dropdown";

interface LönProps {
  editData?: any;
  handleChange?: (name: string, value: any) => void;
  anställd?: any;
  viewMode?: boolean;
}
// #endregion

export default function Lön({ editData, handleChange, anställd, viewMode }: LönProps) {
  // #region Dropdown Options
  const dropdownOptions = {
    ersättningPer: [
      { value: "", label: "Välj period" },
      { value: "Månad", label: "Månad" },
      { value: "Timme", label: "Timme" },
      { value: "Dag", label: "Dag" },
      { value: "Vecka", label: "Vecka" },
      { value: "År", label: "År" },
    ],
  };
  // #endregion

  if (viewMode) {
    return (
      <div className="bg-slate-800 p-6 rounded-lg">
        <h3 className="text-xl font-semibold text-white mb-4">Lön</h3>
        <div className="space-y-3">
          {[
            ["Kompensation", anställd.kompensation ? `${anställd.kompensation} kr` : null],
            ["Ersättning per", anställd.ersättning_per],
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
        <TextFält
          label="Kompensation (kr)"
          name="kompensation"
          type="number"
          value={editData.kompensation || ""}
          onChange={(e) => handleChange?.("kompensation", e.target.value)}
        />
        <Dropdown
          label="Ersättning per"
          value={editData.ersättningPer || ""}
          onChange={(value) => handleChange?.("ersättningPer", value)}
          options={dropdownOptions.ersättningPer}
        />
      </div>
    </div>
  );
}
