// #region Huvud
"use client";

import TextFalt from "../../_components/TextFalt";
import Dropdown from "../../_components/Dropdown";
import { ArbetsbelastningProps } from "../_types/types";
import { useKontrakt } from "../_hooks/useKontrakt";

// #endregion

export default function Arbetsbelastning({ viewMode }: ArbetsbelastningProps) {
  const { state } = useKontrakt();

  // Får inte bort nedan...
  if (!state.valdAnställd) {
    return null;
  }

  if (viewMode) {
    return (
      <div className="bg-slate-800 p-6 rounded-lg">
        <h3 className="text-xl font-semibold text-white mb-4">Arbetsbelastning</h3>
        <div className="space-y-3">
          {[
            [
              "Arbetsbelastning",
              state.valdAnställd.arbetsbelastning === "Deltidsanställd" &&
              state.valdAnställd.deltidProcent
                ? `${state.valdAnställd.arbetsbelastning} (${state.valdAnställd.deltidProcent}%)`
                : state.valdAnställd.arbetsbelastning,
            ],
            ["Arbetsvecka", `${state.valdAnställd.arbetsvecka || "Ej angiven"} timmar`],
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
          value={state.valdAnställd.arbetsbelastning || ""}
          onChange={(value) => console.log("TODO: Add handler")}
          options={state.arbetsbelastningOptions}
        />
        <TextFalt
          label="Arbetsvecka (timmar)"
          name="arbetsveckaTimmar"
          type="number"
          value={state.valdAnställd.arbetsvecka || ""}
          onChange={(e) => console.log("TODO: Add handler")}
        />
        {state.valdAnställd.arbetsbelastning === "Deltidsanställd" && (
          <TextFalt
            label="Deltid (%)"
            name="deltidProcent"
            type="number"
            value={state.valdAnställd.deltidProcent || ""}
            onChange={(e) => console.log("TODO: Add handler")}
          />
        )}
      </div>
    </div>
  );
}
