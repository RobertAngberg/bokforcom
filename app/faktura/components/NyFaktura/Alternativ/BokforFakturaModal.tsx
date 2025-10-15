"use client";

import Tabell from "../../../../_components/Tabell";
import Modal from "../../../../_components/Modal";
import { useBokforFakturaModal } from "../../../hooks/useAlternativ";
import { formatCurrency } from "../../../../_utils/format";
import { BokforFakturaModalProps } from "../../../types/types";

export default function BokforFakturaModal({ isOpen, onClose }: BokforFakturaModalProps) {
  const {
    loading,
    statusLoaded,
    formData,
    poster,
    varningar,
    columns,
    hanteraBokför,
    beräknaTotalbelopp,
    visaHusFilKnapp,
    husFilKnappText,
    husFilDisabled,
    husFilDisabledInfo,
    hanteraHUSFil,
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
      <div className="mt-6 space-y-6">
        {/* Information */}
        {varningar.length > 0 && (
          <div className="p-4 bg-blue-900/30 border border-blue-500/50 rounded">
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
        <div className="p-4 bg-slate-700 rounded">
          <h3 className="text-white font-semibold mb-4">Fakturauppgifter:</h3>
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
              <span className="text-white ml-2">{formatCurrency(beräknaTotalbelopp())}</span>
            </div>
          </div>
        </div>

        {/* Bokföringsposter */}
        {poster.length > 0 && (
          <div className="pb-0">
            <Tabell
              data={poster}
              columns={columns}
              getRowId={(item) => `${item.konto}-${item.beskrivning}`}
            />
          </div>
        )}

        {/* Knappar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {visaHusFilKnapp && (
            <div className="flex flex-col gap-2">
              <button
                onClick={hanteraHUSFil}
                disabled={husFilDisabled}
                className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                📄 {husFilKnappText}
              </button>
              {husFilDisabledInfo && (
                <span className="text-xs text-slate-300">⚠️ {husFilDisabledInfo}</span>
              )}
            </div>
          )}

          <div className="flex justify-end gap-4 sm:ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              ❌ Avbryt
            </button>
            <button
              onClick={hanteraBokför}
              disabled={loading || poster.length === 0}
              className="px-6 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? "⏳ Bokför..." : "💼 Bokför"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
