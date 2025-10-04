"use client";
import Tabell, { ColumnDefinition } from "../../../../_components/Tabell";
import Knapp from "../../../../_components/Knapp";
import Modal from "../../../../_components/Modal";
import TextFalt from "../../../../_components/TextFalt";
import { useState } from "react";
import type { BokforModalProps } from "../../../types/types";

export default function BokforModal({ open, onClose, rows, onConfirm }: BokforModalProps) {
  const [kommentar, setKommentar] = useState("");

  const columns: ColumnDefinition<{
    konto: string;
    kontoNamn: string;
    debet: number;
    kredit: number;
  }>[] = [
    { key: "konto", label: "Konto" },
    { key: "kontoNamn", label: "Namn" },
    { key: "debet", label: "Debet" },
    { key: "kredit", label: "Kredit" },
  ];

  return (
    <Modal isOpen={open} onClose={onClose} title="Bokföringsverifikat" maxWidth="lg">
      <Tabell data={rows} columns={columns} getRowId={(row) => row.konto} />
      <div className="mt-4">
        <TextFalt
          label=""
          name="kommentar"
          type="text"
          placeholder="Kommentar (valfri)"
          value={kommentar}
          onChange={(e) => setKommentar(e.target.value)}
          required={false}
        />
      </div>
      <div className="mt-6 flex justify-end">
        <Knapp text="Bokför" onClick={() => onConfirm?.(kommentar)} />
      </div>
    </Modal>
  );
}
