// #region Huvud
"use client";

import Dropdown from "../../_components/Dropdown";
import { AnställningstypProps } from "../_types/types";
import { useKontrakt } from "../_hooks/useKontrakt";

// #endregion

export default function Anställningstyp({ viewMode }: AnställningstypProps) {
  const { state, handlers } = useKontrakt();
  // Får inte bort nedan....
  if (!state.valdAnställd) {
    return null;
  }

  if (viewMode) {
    return (
      <div className="bg-slate-800 p-6 rounded-lg">
        <h3 className="text-xl font-semibold text-white mb-4">Anställningstyp</h3>
        <div className="space-y-3">
          <div>
            <span className="text-gray-400">Anställningstyp:</span>
            <div className="text-white">{state.valdAnställd.anställningstyp || "Ej angiven"}</div>
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
          value={state.valdAnställd.anställningstyp || ""}
          onChange={(value) => console.log("TODO: Add handler")}
          options={state.anställningstypOptions}
        />
      </div>
    </div>
  );
}
