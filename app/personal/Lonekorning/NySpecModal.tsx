"use client";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Modal from "../../_components/Modal";

interface NySpecModalProps {
  isOpen: boolean;
  onClose: () => void;
  nySpecDatum: Date | null;
  setNySpecDatum: (date: Date | null) => void;
  anstallda: Array<{ id: string; [key: string]: any }>;
  onSpecCreated: () => void;
}

export default function NySpecModal({
  isOpen,
  onClose,
  nySpecDatum,
  setNySpecDatum,
  anstallda,
  onSpecCreated,
}: NySpecModalProps) {
  const handleCreateSpec = async () => {
    if (!nySpecDatum) {
      alert("Välj ett datum först!");
      return;
    }
    if (anstallda.length === 0) {
      alert("Ingen anställd hittades.");
      return;
    }
    let utbetalningsdatum = null;
    if (nySpecDatum instanceof Date && !isNaN(nySpecDatum.getTime())) {
      utbetalningsdatum = nySpecDatum.toISOString().slice(0, 10);
    }
    if (!utbetalningsdatum) {
      alert("Fel: utbetalningsdatum saknas eller är ogiltigt!");
      return;
    }
    const res = await import("../actions").then((mod) =>
      mod.skapaNyLönespec({
        anställd_id: parseInt(anstallda[0].id),
        utbetalningsdatum,
      })
    );
    if (res?.success === false) {
      alert("Fel: " + (res.error || "Misslyckades att skapa lönespecifikation."));
    } else {
      alert("Ny lönespecifikation skapad!");
      onClose();
      onSpecCreated();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Välj utbetalningsdatum" maxWidth="sm">
      <div className="mb-6">
        <DatePicker
          selected={nySpecDatum}
          onChange={(date) => setNySpecDatum(date)}
          dateFormat="yyyy-MM-dd"
          className="bg-slate-800 text-white px-4 py-2 rounded-lg w-full border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-700 focus:border-cyan-700 cursor-pointer hover:border-slate-500 transition-colors"
          placeholderText="Välj datum"
          calendarClassName="bg-slate-900 text-white"
          dayClassName={(date) => "text-cyan-400"}
        />
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
