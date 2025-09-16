//#region Huvud
"use client";

import { useSparadeFakturor } from "../_hooks/useSparadeFakturor";
import Toast from "../../_components/Toast";
import { SparadeFakturorProps } from "../_types/types";
//#endregion

export default function SparadeFakturor({
  fakturor,
  activeInvoiceId,
  onSelectInvoice,
}: SparadeFakturorProps) {
  const {
    loadingInvoiceId,
    betalningsModal,
    toast,
    setBetalningsModal,
    setToast,
    registreraBetalning,
    handleSelectInvoice,
    handleDeleteInvoice,
  } = useSparadeFakturor(onSelectInvoice);

  return (
    <>
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />

      <div className="text-white">
        {fakturor.length === 0 ? (
          <p className="text-gray-400 italic">Inga fakturor hittades.</p>
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

              const isActive = activeInvoiceId === faktura.id;
              const isLoading = loadingInvoiceId === faktura.id;

              // Avgör status
              let statusBadge: string | null = null;
              let statusColor = "text-white";

              if (faktura.status_betalning === "Betald") {
                statusBadge = "✅ Betald";
                statusColor = "text-green-400";
              } else if (faktura.status_bokförd && faktura.status_bokförd !== "Ej bokförd") {
                statusBadge = "📚 Bokförd, ej betald";
                statusColor = "text-white";
              } else {
                statusBadge = "❌ Ej bokförd";
                statusColor = "text-white";
              }

              return (
                <div
                  key={faktura.id}
                  className={`bg-slate-900 border rounded px-4 py-3 hover:bg-slate-800 text-sm relative ${
                    isActive ? "border-green-500" : "border-slate-700"
                  } ${isLoading ? "opacity-75" : ""}`}
                >
                  {/* Radera-knapp i övre högra hörnet */}
                  {faktura.status_betalning !== "Betald" &&
                    (!faktura.status_bokförd || faktura.status_bokförd === "Ej bokförd") && (
                      <button
                        onClick={() => handleDeleteInvoice(faktura.id)}
                        className="absolute top-2 right-2 hover:text-red-500 text-lg z-10"
                        title="Ta bort faktura"
                        disabled={isLoading}
                      >
                        🗑️
                      </button>
                    )}

                  <div
                    className={`cursor-pointer ${isLoading ? "pointer-events-none" : ""} pr-8`}
                    onClick={() => !isLoading && handleSelectInvoice(faktura.id)}
                  >
                    {/* Huvudrad med nummer och kund */}
                    <div className="font-semibold text-base mb-3">
                      #{faktura.fakturanummer} – {faktura.kundnamn ?? "Okänd kund"}
                    </div>

                    {/* Avskiljare */}
                    <hr className="border-slate-600 mb-3" />

                    {/* Datum */}
                    <div className="text-white text-sm mb-2">{datum}</div>

                    {/* Belopp */}
                    <div className="font-medium text-white text-sm mb-2">
                      {faktura.totalBelopp?.toFixed(2) ?? "0.00"} kr
                    </div>

                    {/* Status */}
                    <div className={`text-sm ${statusColor} mb-2`}>{statusBadge}</div>

                    {/* Extra info om betald */}
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

                  {/* ROT/RUT-label i nedre högra hörnet */}
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

      {/* Betalningsmodal */}
      {betalningsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-white mb-4">💰 Registrera betalning</h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const kontoklass = formData.get("kontoklass")?.toString() || "1930";
                registreraBetalning(betalningsModal.fakturaId, betalningsModal.belopp, kontoklass);
              }}
            >
              <div className="mb-4">
                <label className="block text-white text-sm font-bold mb-2">
                  Belopp att registrera:
                </label>
                <input
                  type="number"
                  step="0.01"
                  defaultValue={betalningsModal.belopp}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                  readOnly
                />
              </div>

              <div className="mb-4">
                <label className="block text-white text-sm font-bold mb-2">
                  Konto för betalning:
                </label>
                <select
                  name="kontoklass"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                  defaultValue="1930"
                >
                  <option value="1930">1930 - Företagskonto/Bankkonto</option>
                  <option value="1910">1910 - Kassa</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                >
                  ✅ Registrera betalning
                </button>
                <button
                  type="button"
                  onClick={() => setBetalningsModal(null)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                >
                  ❌ Avbryt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
