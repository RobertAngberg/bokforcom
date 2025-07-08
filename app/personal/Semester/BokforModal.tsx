"use client";
import Tabell, { ColumnDefinition } from "../../_components/Tabell";
import Knapp from "../../_components/Knapp";

interface BokforModalProps {
  open: boolean;
  onClose: () => void;
  rows: { konto: string; namn: string; debet: number; kredit: number }[];
}

export default function BokforModal({ open, onClose, rows }: BokforModalProps) {
  if (!open) return null;

  const columns: ColumnDefinition<any>[] = [
    { key: "konto", label: "Konto" },
    { key: "namn", label: "Namn" },
    { key: "debet", label: "Debet" },
    { key: "kredit", label: "Kredit" },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-slate-800 border border-slate-600 rounded-xl w-full max-w-lg p-6 shadow-2xl relative">
        <button
          className="absolute top-3 right-3 text-slate-400 hover:text-white text-xl"
          onClick={onClose}
        >
          ×
        </button>
        <h2 className="text-xl font-bold text-white mb-4">Bokföringsverifikat</h2>
        <Tabell data={rows} columns={columns} getRowId={(row) => row.konto} />
        <div className="mt-6 flex justify-end">
          <Knapp text="Bokför" onClick={() => {}} />
        </div>
      </div>
    </div>
  );
}
