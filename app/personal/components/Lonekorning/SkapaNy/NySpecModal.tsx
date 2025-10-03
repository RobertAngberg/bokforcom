"use client";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Modal from "../../../../_components/Modal";
import { NySpecModalProps } from "../../../types/types";
import { useLonespec } from "../../../hooks/useLonespecar";

export default function NySpecModal({
  isOpen,
  onClose,
  nySpecDatum,
  setNySpecDatum,
  anstallda,
  onSpecCreated,
}: NySpecModalProps) {
  const { valdAnställd, handleCreateSpec, handleAnställdChange, handleDatumChange } = useLonespec({
    enableNewSpecModal: true,
    nySpecModalOpen: isOpen,
    nySpecDatum,
    setNySpecDatum,
    anstallda,
    onSpecCreated,
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Skapa ny lönespecifikation" maxWidth="sm">
      <div className="space-y-4 mb-6">
        {/* Anställd-väljare */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Välj anställd</label>
          <select
            value={valdAnställd || ""}
            onChange={(e) => handleAnställdChange?.(e.target.value)}
            className="bg-slate-800 text-white px-4 py-2 rounded-lg w-full border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-700 focus:border-cyan-700 cursor-pointer hover:border-slate-500 transition-colors"
          >
            <option value="">-- Välj anställd --</option>
            {anstallda.map((anställd) => (
              <option key={anställd.id} value={anställd.id}>
                {anställd.förnamn} {anställd.efternamn}
              </option>
            ))}
          </select>
        </div>

        {/* Datum-väljare */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Utbetalningsdatum</label>
          <DatePicker
            selected={nySpecDatum}
            onChange={(date) => handleDatumChange?.(date)}
            dateFormat="yyyy-MM-dd"
            className="bg-slate-800 text-white px-4 py-2 rounded-lg w-full border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-700 focus:border-cyan-700 cursor-pointer hover:border-slate-500 transition-colors"
            placeholderText="Välj datum"
            calendarClassName="bg-slate-900 text-white"
            dayClassName={() => "text-cyan-400"}
          />
        </div>
      </div>
      <div className="flex gap-3 justify-end">
        <button
          className="px-5 py-2 bg-slate-700 text-gray-200 rounded-lg hover:bg-slate-600 transition font-semibold"
          onClick={onClose}
        >
          Avbryt
        </button>
        <button
          className="px-5 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition font-semibold shadow"
          onClick={handleCreateSpec}
        >
          Skapa
        </button>
      </div>
    </Modal>
  );
}
