"use client";
import Tabell, { ColumnDefinition } from "../../_components/Tabell";
import Knapp from "../../_components/Knapp";
import Modal from "../../_components/Modal";
import { useState } from "react";

interface BokforModalProps {
  open: boolean;
  onClose: () => void;
  rows: { konto: string; namn: string; debet: number; kredit: number }[];
  onConfirm?: (kommentar: string) => void;
}

export default function BokforModal({ open, onClose, rows, onConfirm }: BokforModalProps) {
  const [kommentar, setKommentar] = useState("");

  const columns: ColumnDefinition<any>[] = [
    { key: "konto", label: "Konto" },
    { key: "namn", label: "Namn" },
    { key: "debet", label: "Debet" },
    { key: "kredit", label: "Kredit" },
  ];

  return (
    <Modal isOpen={open} onClose={onClose} title="Bokföringsverifikat" maxWidth="lg">
      <Tabell data={rows} columns={columns} getRowId={(row) => row.konto} />
      <div className="mt-4">
        <input
          type="text"
          placeholder="Kommentar (valfri)"
          value={kommentar}
          onChange={(e) => setKommentar(e.target.value)}
          className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600"
        />
      </div>
      <div className="mt-6 flex justify-end">
        <Knapp text="Bokför" onClick={() => onConfirm?.(kommentar)} />
      </div>
    </Modal>
  );
}
