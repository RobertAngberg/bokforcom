"use client";

import Tabell from "../../../../_components/Tabell";
import Modal from "../../../../_components/Modal";
import Knapp from "../../../../_components/Knapp";
import { useBokforFakturaModal } from "../../../hooks/useAlternativ";
import { formatCurrency } from "../../../../_utils/format";
import { BokforFakturaModalProps } from "../../../types/types";

export default function BokforFakturaModal({ isOpen, onClose }: BokforFakturaModalProps) {
  const {
    loading,
    statusLoaded,
    formData,
    bokföringsmetod,
    poster,
    columns,
    hanteraBokför,
    beräknaTotalbelopp,
    visaHusFilKnapp,
    husFilKnappText,
    husFilDisabled,
    husFilDisabledInfo,
    ärFakturanRedanBokförd,
    ärFakturanBokfördOchBetald,
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

  const bokföringsmetodNormalized = (bokföringsmetod || "").toLowerCase();

  const helperText = ärFakturanBokfördOchBetald
    ? "Fakturan är redan bokförd och betald."
    : ärFakturanRedanBokförd
      ? "Här bokför du när fakturan betalats."
      : bokföringsmetodNormalized === "kontantmetoden"
        ? "Här bokför du fakturan när den betalats."
        : "Här bokför du en skickad faktura som en kundfordran.";
  const bokforKnappText = ärFakturanRedanBokförd
    ? "💼 Bokför betald"
    : bokföringsmetodNormalized === "kontantmetoden"
      ? "💼 Bokför betald"
      : "💼 Bokför skickad";
  const bokforLoadingText = `${bokforKnappText.replace("💼", "⏳")}...`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`📊 Bokför faktura ${formData.fakturanummer}`}
      maxWidth="4xl"
      containerClassName="w-full"
    >
      <p className="mt-2 text-sm text-slate-300 text-center">{helperText}</p>
      <div className="mt-6 space-y-6">
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
            <div className="overflow-x-auto">
              <Tabell
                data={poster}
                columns={columns}
                getRowId={(item) => `${item.konto}-${item.beskrivning}`}
              />
            </div>
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
            <Knapp onClick={onClose} text="❌ Avbryt" />
            <Knapp
              onClick={hanteraBokför}
              text={bokforKnappText}
              loading={loading}
              loadingText={bokforLoadingText}
              disabled={poster.length === 0 || ärFakturanBokfördOchBetald}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
