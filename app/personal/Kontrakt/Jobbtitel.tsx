// #region Huvud
"use client";

import TextFalt from "../../_components/TextFalt";
import { JobbtitelProps } from "../_types/types";

// #endregion

export default function Jobbtitel({ editData, handleChange, anställd, viewMode }: JobbtitelProps) {
  if (viewMode) {
    return (
      <div className="bg-slate-800 p-6 rounded-lg">
        <h3 className="text-xl font-semibold text-white mb-4">Jobbtitel</h3>
        <div className="space-y-3">
          <div>
            <span className="text-gray-400">Jobbtitel:</span>
            <div className="text-white">{anställd.jobbtitel || "Ej angiven"}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 p-6 rounded-lg">
      <h3 className="text-xl font-semibold text-white mb-4">Jobbtitel</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TextFalt
          label="Jobbtitel"
          name="jobbtitel"
          value={editData.jobbtitel || ""}
          onChange={(e) => handleChange?.("jobbtitel", e.target.value)}
        />
      </div>
    </div>
  );
}
