"use client";

import { useFaktura } from "../../hooks/useFaktura";
import { useSparade } from "../../hooks/useSparade";
import { useSparadeFakturorPage } from "../../hooks/useLeverantorer";
import TillbakaPil from "../../../_components/TillbakaPil";

interface SparadeProps {
  onBackToMenu?: () => void;
  onEditFaktura?: (fakturaId: number) => void;
}

export default function Sparade({ onBackToMenu, onEditFaktura }: SparadeProps) {
  const { data } = useSparadeFakturorPage();
  const { toastState, clearToast } = useFaktura();
  const { loadingInvoiceId, handleSelectInvoice, handleDeleteInvoice } = useSparade();

  const fakturor = data?.fakturor || [];

  return (
    <>
      <div className="relative mb-8 flex items-center justify-center">
        {onBackToMenu && <TillbakaPil onClick={onBackToMenu} />}
        <h1 className="text-3xl text-center w-full">Sparade Fakturor</h1>
      </div>

      <div className="text-white">
        {fakturor.length === 0 ? (
          <p className="text-gray-400 italic">Inga fakturor hittades.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {fakturor.map((faktura: any) => {
              const datum = faktura.fakturadatum
                ? new Date(faktura.fakturadatum).toLocaleDateString("sv-SE", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "";

              const isLoading = loadingInvoiceId === faktura.id;

              let statusBadge: string | null = null;
              let statusColor = "text-white";

              if (faktura.status_betalning === "Betald") {
                statusBadge = "✅ Betald";
                statusColor = "text-green-400";
              } else if (faktura.status_bokförd && faktura.status_bokförd !== "Ej bokförd") {
                statusBadge = "📊 Bokförd, ej betald";
                statusColor = "text-white";
              } else {
                statusBadge = "⏳ Ej bokförd";
                statusColor = "text-yellow-400";
              }

              return (
                <div key={faktura.id} className="relative">
                  <div
                    className={`
                      p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-lg
                      bg-gray-800 border-gray-600 text-white hover:bg-gray-700
                      ${isLoading ? "opacity-50" : ""}
                    `}
                    onClick={() =>
                      onEditFaktura ? onEditFaktura(faktura.id) : handleSelectInvoice(faktura.id)
                    }
                  >
                    <div className="font-semibold text-base mb-3">
                      #{faktura.fakturanummer} – {faktura.kundnamn ?? "Okänd kund"}
                    </div>
                    <hr className="border-slate-600 mb-3" />
                    <div className="text-white text-sm mb-2">{datum}</div>
                    <div className="font-medium text-white text-sm mb-2">
                      {faktura.totalBelopp?.toFixed(2) ?? "0.00"} kr
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
    </>
  );
}
