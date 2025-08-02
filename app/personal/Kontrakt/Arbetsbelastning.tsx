// #region Huvud
"use client";

import TextFalt from "../../_components/TextFalt";
import Dropdown from "../../_components/Dropdown";

interface ArbetsbelastningProps {
  editData?: any;
  handleChange?: (name: string, value: any) => void;
  anställd?: any;
  viewMode?: boolean;
}
// #endregion

export default function Arbetsbelastning({
  editData,
  handleChange,
  anställd,
  viewMode,
}: ArbetsbelastningProps) {
  // #region Dropdown Options
  const dropdownOptions = {
    arbetsbelastning: [
      { value: "", label: "Välj arbetsbelastning" },
      { value: "Heltidsanställd", label: "Heltidsanställd" },
      { value: "Deltidsanställd", label: "Deltidsanställd" },
    ],
  };
  // #endregion

  if (viewMode) {
    return (
      <div className="bg-slate-800 p-6 rounded-lg">
        <h3 className="text-xl font-semibold text-white mb-4">Arbetsbelastning</h3>
        <div className="space-y-3">
          {[
            [
              "Arbetsbelastning",
              anställd.arbetsbelastning === "Deltidsanställd" && anställd.deltid_procent
                ? `${anställd.arbetsbelastning} (${anställd.deltid_procent}%)`
                : anställd.arbetsbelastning,
            ],
            ["Arbetsvecka", `${anställd.arbetsvecka_timmar || "Ej angiven"} timmar`],
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
      <h3 className="text-xl font-semibold text-white mb-4">Arbetsbelastning</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Dropdown
          label="Arbetsbelastning"
          value={editData.arbetsbelastning || ""}
          onChange={(value) => handleChange?.("arbetsbelastning", value)}
          options={dropdownOptions.arbetsbelastning}
        />
        <TextFalt
          label="Arbetsvecka (timmar)"
          name="arbetsveckaTimmar"
          type="number"
          value={editData.arbetsveckaTimmar || ""}
          onChange={(e) => handleChange?.("arbetsveckaTimmar", e.target.value)}
        />
        {editData.arbetsbelastning === "Deltidsanställd" && (
          <TextFalt
            label="Deltid (%)"
            name="deltidProcent"
            type="number"
            value={editData.deltidProcent || ""}
            onChange={(e) => handleChange?.("deltidProcent", e.target.value)}
          />
        )}
      </div>
    </div>
  );
}
