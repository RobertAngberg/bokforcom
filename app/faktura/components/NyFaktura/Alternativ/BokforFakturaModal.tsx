"use client";

import Tabell from "../../../../_components/Tabell";
import Modal from "../../../../_components/Modal";
import Toast from "../../../../_components/Toast";
import { useBokforFakturaModal } from "../../../hooks/useAlternativ";
import { useFakturaClient } from "../../../hooks/useFaktura";
import { BokforFakturaModalProps } from "../../../types/types";

export default function BokforFakturaModal({ isOpen, onClose }: BokforFakturaModalProps) {
  const { clearToast } = useFakturaClient();
  const {
    loading,
    fakturaStatus,
    statusLoaded,
    toast,
    ärKontantmetod,
    formData,
    poster,
    varningar,
    columns,
    hanteraBokför,
    beräknaTotalbelopp,
  } = useBokforFakturaModal(isOpen, onClose);

  if (!isOpen) return null;

  // Wait for status to be loaded before rendering the modal content
  if (!statusLoaded) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`📊 Bokför faktura ${formData.fakturanummer}`}
        maxWidth="4xl"
      >
        <div className="text-center py-8">
          <div className="text-white">⏳ Laddar fakturasstatus...</div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`📊 Bokför faktura ${formData.fakturanummer}`}
      maxWidth="4xl"
    >
      {/* Information */}
      {varningar.length > 0 && (
        <div className="mb-6 p-4 bg-blue-900/30 border border-blue-500/50 rounded">
          <h3 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
            💡 Information:
          </h3>
          <ul className="text-blue-200 space-y-1">
            {varningar.map((varning, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <div>
                  {varning
                    .replace(/^⚠️\s*/, "")
                    .split("\n")
                    .map((line, lineIndex) => (
                      <div key={lineIndex}>{line}</div>
                    ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Faktura-info */}
      <div className="mb-6 p-4 bg-slate-700 rounded">
        <h3 className="text-white font-semibold mb-2">Fakturanuppgifter:</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Kund:</span>
            <span className="text-white ml-2">{formData.kundnamn}</span>
          </div>
          <div>
            <span className="text-gray-400">Fakturanummer:</span>
            <span className="text-white ml-2">{formData.fakturanummer}</span>
          </div>
          <div>
            <span className="text-gray-400">Antal artiklar:</span>
            <span className="text-white ml-2">{formData.artiklar?.length || 0}</span>
          </div>
          <div>
            <span className="text-gray-400">Totalt inkl. moms:</span>
            <span className="text-white ml-2">{beräknaTotalbelopp().toFixed(2)} kr</span>
          </div>
        </div>
      </div>

      {/* Bokföringsposter */}
      {poster.length > 0 && (
        <div className="mb-6">
          <h3 className="text-white font-semibold mb-4">Föreslagna bokföringsposter:</h3>

          <Tabell
            data={poster}
            columns={columns}
            getRowId={(item) => `${item.konto}-${item.beskrivning}`}
          />
        </div>
      )}

      {/* Knappar */}
      <div className="flex justify-end gap-4">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Avbryt
        </button>
        <button
          onClick={hanteraBokför}
          disabled={loading || poster.length === 0}
          className="px-6 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>⏳ Bokför...</>
          ) : fakturaStatus.status_bokförd && fakturaStatus.status_bokförd !== "Ej bokförd" ? (
            <>💰 Registrera betalning</>
          ) : ärKontantmetod ? (
            <>📚 Bokför betalning till Bank/Kassa</>
          ) : (
            <>📚 Bokför faktura till Kundfordringar</>
          )}
        </button>
      </div>

      {/* Info längst ner */}
      <div className="mt-4 text-xs text-slate-400 space-y-1">
        <div>
          Bokföringsmetod:{" "}
          <span className="text-white">
            {ärKontantmetod ? "💰 Kontantmetod" : "📄 Fakturametoden"}
          </span>
        </div>
        <div>
          {/* Visa olika text beroende på vad som händer */}
          {fakturaStatus.status_bokförd && fakturaStatus.status_bokförd !== "Ej bokförd"
            ? // Betalningsregistrering - fakturan är redan bokförd
              "💰 Intäkten är redan registrerad, nu registreras betalningen."
            : ärKontantmetod
              ? // Kontantmetod - intäkt och betalning samtidigt
                "💡 Intäkten och betalningen registreras samtidigt till Bank/Kassa."
              : // Fakturametoden - intäkt först, betalning senare
                "💡 Intäkten registreras nu, betalning bokförs senare."}
        </div>
      </div>

      {toast.isVisible && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}
    </Modal>
  );
}
