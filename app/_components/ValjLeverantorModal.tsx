"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import Knapp from "./Knapp";
import LoadingSpinner from "./LoadingSpinner";
import { getLeverantörer } from "../faktura/actions/leverantorActions";
import { type Leverantör } from "../faktura/types/types";

interface VäljLeverantörModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelected?: (leverantör: Leverantör) => void; // Callback för att sätta vald leverantör utan navigation
  skipNavigate?: boolean; // Om true navigerar vi inte utan använder callback
}
export default function ValjLeverantorModal({
  isOpen,
  onClose,
  onSelected,
  skipNavigate = false,
}: VäljLeverantörModalProps) {
  const [leverantörer, setLeverantörer] = useState<Leverantör[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeverantör, setSelectedLeverantör] = useState<number | null>(null);
  const router = useRouter();

  const loadLeverantörer = async () => {
    setLoading(true);
    const result = await getLeverantörer();
    if (result.success) {
      setLeverantörer(result.leverantörer || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadLeverantörer();
      setSelectedLeverantör(null); // Reset selection
    }
  }, [isOpen]);

  const handleContinue = () => {
    if (!selectedLeverantör) return;
    const levObj = leverantörer.find((l) => l.id === selectedLeverantör);
    if (onSelected && levObj) {
      onSelected(levObj);
    }
    if (!skipNavigate) {
      router.push(`/bokfor?levfakt=true&leverantorId=${selectedLeverantör}`);
    }
    onClose();
  };

  // Auto-hantering: om endast en leverantör och modal öppnas
  useEffect(() => {
    if (isOpen && !loading && leverantörer.length === 1 && !selectedLeverantör) {
      const enda = leverantörer[0];

      if (skipNavigate && onSelected) {
        // Direkt välj och stäng
        onSelected(enda);
        onClose();
      } else {
        // Bara sätt vald leverantör
        setSelectedLeverantör(enda.id || null);
      }
    }
  }, [isOpen, loading, leverantörer, skipNavigate, onSelected, onClose, selectedLeverantör]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Välj leverantör" maxWidth="lg">
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <LoadingSpinner />
          </div>
        ) : leverantörer.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🏢</div>
            <h3 className="text-lg text-white mb-2">Inga leverantörer ännu</h3>
            <p className="text-gray-400 mb-4">
              Du måste först skapa en leverantör innan du kan registrera en leverantörsfaktura.
            </p>
            <Knapp text="Stäng" onClick={onClose} className="bg-gray-600 hover:bg-gray-700" />
          </div>
        ) : (
          <>
            <p className="text-gray-300 mb-4">Välj vilken leverantör denna faktura kommer från:</p>

            <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
              {leverantörer.map((leverantör) => (
                <div
                  key={leverantör.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedLeverantör === leverantör.id
                      ? "border-cyan-500 bg-cyan-500/20"
                      : "border-slate-600 bg-slate-800 hover:border-slate-500"
                  }`}
                  onClick={() => setSelectedLeverantör(leverantör.id!)}
                >
                  <div className="font-medium text-white">{leverantör.namn}</div>
                  {leverantör.organisationsnummer && (
                    <div className="text-sm text-gray-400">
                      Org-nr: {leverantör.organisationsnummer}
                    </div>
                  )}
                  {leverantör.email && (
                    <div className="text-sm text-gray-400">{leverantör.email}</div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <Knapp text="Avbryt" onClick={onClose} className="bg-gray-600 hover:bg-gray-700" />
              <Knapp text="Fortsätt" onClick={handleContinue} disabled={!selectedLeverantör} />
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
