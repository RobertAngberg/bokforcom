// #region Huvud
"use client";

import TextFält from "../../_components/TextFält";

interface TjänsteställeProps {
  editData?: any;
  handleChange?: (name: string, value: any) => void;
  anställd?: any;
  viewMode?: boolean;
}
// #endregion

export default function Tjänsteställe({
  editData,
  handleChange,
  anställd,
  viewMode,
}: TjänsteställeProps) {
  if (viewMode) {
    return (
      <div className="bg-slate-800 p-6 rounded-lg">
        <h3 className="text-xl font-semibold text-white mb-4">Tjänsteställe</h3>
        <div className="space-y-3">
          {[
            ["Adress", anställd.tjänsteställe_adress],
            ["Ort", anställd.tjänsteställe_ort],
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
      <h3 className="text-xl font-semibold text-white mb-4">Tjänsteställe</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TextFält
          label="Adress"
          name="tjänsteställeAdress"
          value={editData.tjänsteställeAdress || ""}
          onChange={(e) => handleChange?.("tjänsteställeAdress", e.target.value)}
        />
        <TextFält
          label="Ort"
          name="tjänsteställeOrt"
          value={editData.tjänsteställeOrt || ""}
          onChange={(e) => handleChange?.("tjänsteställeOrt", e.target.value)}
        />
      </div>
    </div>
  );
}
