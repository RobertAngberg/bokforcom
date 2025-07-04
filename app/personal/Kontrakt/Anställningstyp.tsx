// #region Huvud
"use client";

import Dropdown from "../../_components/Dropdown";

interface AnställningstypProps {
  editData?: any;
  handleChange?: (name: string, value: any) => void;
  anställd?: any;
  viewMode?: boolean;
}
// #endregion

export default function Anställningstyp({
  editData,
  handleChange,
  anställd,
  viewMode,
}: AnställningstypProps) {
  // #region Dropdown Options
  const dropdownOptions = {
    anställningstyp: [
      { value: "", label: "Välj anställningstyp" },
      { value: "Tillsvidare", label: "Tillsvidare" },
      { value: "Visstid", label: "Visstid" },
      { value: "Provanställning", label: "Provanställning" },
      { value: "Säsongsanställning", label: "Säsongsanställning" },
      { value: "Månadslön", label: "Månadslön" },
    ],
  };
  // #endregion

  if (viewMode) {
    return (
      <div className="bg-slate-800 p-6 rounded-lg">
        <h3 className="text-xl font-semibold text-white mb-4">Anställningstyp</h3>
        <div className="space-y-3">
          <div>
            <span className="text-gray-400">Anställningstyp:</span>
            <div className="text-white">{anställd.anställningstyp || "Ej angiven"}</div>
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
          value={editData.anställningstyp || ""}
          onChange={(value) => handleChange?.("anställningstyp", value)}
          options={dropdownOptions.anställningstyp}
        />
      </div>
    </div>
  );
}
