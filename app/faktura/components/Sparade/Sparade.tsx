"use client";

import { useSparade } from "../../hooks/useSparade";
import { useSparadeFakturorPage } from "../../hooks/useLeverantorer/useSparadeFakturor";
import TillbakaPil from "../../../_components/TillbakaPil";
import { formatCurrency } from "../../../_utils/format";
import type { SparadeProps, SparadFaktura } from "../../types/types";
import Modal from "../../../_components/Modal";
import LoadingSpinner from "../../../_components/LoadingSpinner";

// Normalize status functions (moved from utils/status.ts).. spaghetti...
const normalizeStatus = (status: string | null | undefined) => {
  const normalized = (status || "").trim().toLowerCase();
  return normalized === "delvis betald" ? "skickad" : normalized;
};

const isStatusSkickad = (status: string | null | undefined) =>
  normalizeStatus(status) === "skickad";

const isStatusFardig = (status: string | null | undefined) => normalizeStatus(status) === "färdig";

const resolveStatus = (
  status: string | null | undefined,
  legacy?: {
    status_bokförd?: string | null | undefined;
    status_betalning?: string | null | undefined;
  }
) => {
  const normalized = normalizeStatus(status);
  if (normalized) {
    return status || normalized;
  }

  const bokford = (legacy?.status_bokförd || "").trim().toLowerCase();
  const betalning = (legacy?.status_betalning || "").trim().toLowerCase();

  if (betalning === "betald") {
    return "Färdig";
  }

  if (bokford === "bokförd") {
    return "Skickad";
  }

  return "Oskickad";
};

export default function Sparade({
  onBackToMenu,
  onEditFaktura,
  isOffertView = false,
}: SparadeProps) {
  const { data, loading } = useSparadeFakturorPage();
  const {
    loadingInvoiceId,
    handleSelectInvoice,
    handleDeleteInvoice,
    confirmDeleteFaktura,
    showDeleteModal,
    setShowDeleteModal,
    deleteFakturaId,
  } = useSparade();

  const allFakturor: SparadFaktura[] = data?.fakturor ?? [];

  // Filtrera baserat på om vi visar offerter eller fakturor
  const fakturor = allFakturor.filter((f) => (isOffertView ? f.isOffert : !f.isOffert));

  const docType = isOffertView ? "offerter" : "fakturor";

  return (
    <>
      {onBackToMenu && (
        <div className="relative mb-8">
          <TillbakaPil onClick={onBackToMenu} />
        </div>
      )}

      <div className="text-white">
        {loading ? (
          <LoadingSpinner />
        ) : fakturor.length === 0 ? (
          <p className="text-gray-400 italic text-center">Inga {docType} hittades.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {fakturor.map((faktura) => {
              const datum = faktura.fakturadatum
                ? new Date(faktura.fakturadatum).toLocaleDateString("sv-SE", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "";

              const isLoading = loadingInvoiceId === faktura.id;

              const status = resolveStatus(faktura.status, {
                status_bokförd: faktura.status_bokförd,
                status_betalning: faktura.status_betalning,
              });

              let statusBadge: string | null = null;
              let statusColor = "text-white";

              const harRegistreradKundbetalning = isStatusSkickad(status) && !!faktura.betaldatum;

              if (isStatusFardig(status)) {
                statusBadge = "✅ Bokförd & betald";
                statusColor = "text-green-400";
              } else if (harRegistreradKundbetalning) {
                statusBadge = "💸 Kund betald";
                statusColor = "text-blue-400";
              } else if (isStatusSkickad(status)) {
                statusBadge = "📊 Skickad";
                statusColor = "text-white";
              } else {
                statusBadge = "⏳ Ej bokförd";
                statusColor = "text-yellow-400";
              }

              return (
                <div key={faktura.id} className="relative">
                  {/* Papperskorg-knapp */}
                  <button
                    className="absolute top-2 right-2 z-10 text-gray-400 hover:text-red-400 transition-colors duration-200 text-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteInvoice(faktura.id, faktura.isOffert);
                    }}
                    title={`Ta bort ${isOffertView ? "offert" : "faktura"}`}
                  >
                    🗑️
                  </button>

                  <div
                    className={`
                      p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-lg
                      bg-gray-800 border-gray-600 text-white hover:bg-gray-700
                      ${isLoading ? "opacity-50" : ""}
                    `}
                    onClick={() =>
                      onEditFaktura
                        ? onEditFaktura(faktura.id, faktura.isOffert)
                        : handleSelectInvoice(faktura.id)
                    }
                  >
                    <div className="font-semibold text-base mb-3">
                      #{faktura.fakturanummer} – {faktura.kundnamn ?? "Okänd kund"}
                    </div>
                    <hr className="border-slate-600 mb-3" />
                    <div className="text-white text-sm mb-2">{datum}</div>
                    <div className="font-medium text-white text-sm mb-2">
                      {formatCurrency(faktura.totalBelopp ?? 0)}
                    </div>
                    <div className={`text-sm ${statusColor} mb-2`}>{statusBadge}</div>
                    {faktura.betaldatum && (
                      <div className="text-white text-xs mt-1">
                        Betald: {new Date(faktura.betaldatum).toLocaleDateString("sv-SE")}
                      </div>
                    )}
                    {isLoading && (
                      <div className="text-blue-400 text-xs mt-1 flex items-center gap-1">
                        <div className="animate-spin w-3 h-3 border border-blue-400 border-t-transparent rounded-full"></div>
                        Laddar...
                      </div>
                    )}
                  </div>

                  {faktura.rotRutTyp && (
                    <div className="absolute bottom-2 right-2 flex flex-col gap-1 items-end">
                      <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                        {faktura.rotRutTyp}
                      </span>
                      {faktura.rot_rut_status === "godkänd" && (
                        <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                          ✅ SKV
                        </span>
                      )}
                      {faktura.rot_rut_status === "väntar" && (
                        <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded">
                          ⏳ SKV
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={`🗑️ Ta bort ${docType.slice(0, -2)}`}
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-white">
            Är du säker på att du vill ta bort {docType.slice(0, -2)} #{" "}
            <span className="font-semibold">
              {fakturor.find((f) => f.id === deleteFakturaId)?.fakturanummer || deleteFakturaId}
            </span>
            ? Detta går inte att ångra.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Avbryt
            </button>
            <button
              onClick={() => confirmDeleteFaktura()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Ta bort
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
