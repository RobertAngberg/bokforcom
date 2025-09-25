// #region Huvud
"use client";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import type { KontraktPeriodProps } from "../../../types/types";
import { dateTillÅÅÅÅMMDD } from "../../../../_utils/datum";
// #endregion

export default function KontraktPeriod({
  editData,
  handleChange,
  anställd,
  viewMode,
}: KontraktPeriodProps) {
  if (viewMode) {
    return (
      <div className="bg-slate-800 p-6 rounded-lg">
        <h3 className="text-xl font-semibold text-white mb-4">Kontrakt</h3>
        <div className="space-y-3">
          {[
            ["Anställningstyp", anställd.anställningstyp],
            ["Från", anställd.startdatum ? dateTillÅÅÅÅMMDD(new Date(anställd.startdatum)) : null],
            ["Till", anställd.slutdatum ? dateTillÅÅÅÅMMDD(new Date(anställd.slutdatum)) : null],
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
      <h3 className="text-xl font-semibold text-white mb-4">Kontrakt</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-white mb-2">Från</label>
          <DatePicker
            selected={editData.startdatum}
            onChange={(date) => date && handleChange?.("startdatum", date)}
            dateFormat="yyyy-MM-dd"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white mb-2">Till</label>
          <DatePicker
            selected={editData.slutdatum}
            onChange={(date) => date && handleChange?.("slutdatum", date)}
            dateFormat="yyyy-MM-dd"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
}
