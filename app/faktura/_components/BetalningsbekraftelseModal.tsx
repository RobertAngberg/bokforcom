"use client";

import Modal from "../../_components/Modal";
import Tabell from "../../_components/Tabell";
import { formatSEK } from "../../_utils/format";
import { BetalningsbekräftelseModalProps } from "../_types/types";
import { useBetalningsbekraftelseModal } from "../_hooks/useBetalningsbekraftelseModal";

export default function BetalningsbekräftelseModal({
  isOpen,
  onClose,
  onConfirm,
  leverantör,
  fakturanummer,
  belopp,
}: BetalningsbekräftelseModalProps) {
  const { poster, columns, totalDebet, totalKredit } = useBetalningsbekraftelseModal({
    leverantör,
    fakturanummer,
    belopp,
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" maxWidth="4xl">
      {/* Egen titel-header */}
      <div className="text-center mb-6 -mt-4">
        <h2 className="text-white text-2xl mb-2">Bekräfta betalning</h2>
        <div className="text-gray-300">
          <div>
            <strong>{leverantör}</strong> - Faktura {fakturanummer}
          </div>
          <div className="text-xl font-bold text-green-400 mt-1">{formatSEK(belopp)}</div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center text-blue-300">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="font-medium">Följande bokföring kommer att genomföras:</span>
          </div>
        </div>

        {/* Bokföringsposter */}
        <div>
          <Tabell data={poster} columns={columns} getRowId={(post) => post.konto} />

          {/* Summor */}
          <div className="mt-4 bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="font-medium text-white">Totaler:</span>
              <div className="flex gap-8">
                <div className="text-right">
                  <div className="text-sm text-gray-400">Debet</div>
                  <div className="font-medium text-white">{formatSEK(totalDebet)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Kredit</div>
                  <div className="font-medium text-white">{formatSEK(totalKredit)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Knappar */}
        <div className="flex gap-4 pt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
          >
            Avbryt
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors font-medium"
          >
            💰 Bokför betalning
          </button>
        </div>
      </div>
    </Modal>
  );
}
