"use client";

import { useState } from "react";
import Modal from "../../_components/Modal";
import Knapp from "../../_components/Knapp";

interface NyLonekorningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLonekorningCreated: () => void;
}

export default function NyLonekorningModal({
  isOpen,
  onClose,
  onLonekorningCreated,
}: NyLonekorningModalProps) {
  const [period, setPeriod] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Föreslå nuvarande månad
  const getCurrentPeriod = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  };

  const handleCreate = async () => {
    if (!period) {
      alert("Du måste ange en period!");
      return;
    }

    setLoading(true);
    try {
      // TODO: Implementera skapaLönekörning
      console.log("Skapar lönekörning för period:", period);

      // Simulera API-anrop
      await new Promise((resolve) => setTimeout(resolve, 1000));

      onLonekorningCreated();
      onClose();
      setPeriod("");
    } catch (error) {
      console.error("❌ Fel vid skapande av lönekörning:", error);
      alert("Kunde inte skapa lönekörning");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Skapa ny lönekörning" maxWidth="sm">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Period (ÅÅÅÅ-MM)</label>
          <input
            type="text"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            placeholder={getCurrentPeriod()}
            className="bg-slate-800 text-white px-4 py-3 rounded-lg w-full border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-700"
            disabled={loading}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 disabled:opacity-50"
          >
            Avbryt
          </button>
          <Knapp
            text={loading ? "Skapar..." : "Skapa lönekörning"}
            onClick={handleCreate}
            disabled={loading}
            className="flex-1"
          />
        </div>
      </div>
    </Modal>
  );
}
