"use client";

import React from "react";
import { formatSEK } from "../../../_utils/format";
import VerifikatModal from "../../../_components/VerifikatModal";
import Knapp from "../../../_components/Knapp";
import Modal from "../../../_components/Modal";
import Tabell from "../../../_components/Tabell";
import { useBokfordaFakturor } from "../../hooks/useLeverantorer";

export default function BokfordaFakturor() {
  const {
    // State
    fakturor,
    loading,
    verifikatModal,
    bekraftelseModal,

    // Computed data
    transaktionskolumner,

    // Actions
    formateraDatum,
    öppnaVerifikat,
    stängVerifikat,
    handleBetalaOchBokför,
    stängBekraftelseModal,
    taBortFaktura,
    utförBokföring,
  } = useBokfordaFakturor();

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Leverantörsfakturor</h2>
        <p className="text-gray-400">Laddar...</p>
      </div>
    );
  }

  if (fakturor.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Leverantörsfakturor</h2>
        <p className="text-gray-400">Inga leverantörsfakturor hittades.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-4">
        Leverantörsfakturor ({fakturor.length})
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-center text-gray-300 pb-2">Datum</th>
              <th className="text-center text-gray-300 pb-2">Leverantör/Kund</th>
              <th className="text-center text-gray-300 pb-2">Fakturanr</th>
              <th className="text-center text-gray-300 pb-2">Belopp</th>
              <th className="text-center text-gray-300 pb-2">Status</th>
              <th className="text-center text-gray-300 pb-2">Kommentar</th>
              <th className="text-center text-gray-300 pb-2">Verifikat</th>
              <th className="text-center text-gray-300 pb-2">Åtgärder</th>
              <th className="text-center text-gray-300 pb-2">Ta bort</th>
            </tr>
          </thead>
          <tbody>
            {fakturor.map((faktura) => (
              <tr key={faktura.id} className="border-b border-gray-800">
                <td className="py-2 text-white text-center">{formateraDatum(faktura.datum)}</td>
                <td className="py-2 text-gray-300 text-center">{faktura.leverantör || "-"}</td>
                <td className="py-2 text-gray-300 text-center">{faktura.fakturanummer || "-"}</td>
                <td className="py-2 text-white text-center">{formatSEK(faktura.belopp)}</td>
                <td className="py-2 text-center">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      faktura.status_bokförd === "Bokförd"
                        ? "bg-green-900 text-green-200"
                        : "bg-yellow-900 text-yellow-200"
                    }`}
                  >
                    {faktura.status_bokförd === "Bokförd" ? "Bokförd" : "Ej bokförd"}
                  </span>
                </td>
                <td className="py-2 text-gray-300 max-w-xs truncate text-center">
                  {faktura.kommentar}
                </td>
                <td className="py-2 text-center">
                  <Knapp
                    text="Visa"
                    onClick={() => öppnaVerifikat(faktura)}
                    className="bg-slate-700 hover:bg-slate-600 text-xs px-3 py-1"
                  />
                </td>
                <td className="py-2 text-center">
                  <div className="flex flex-col gap-1">
                    {faktura.status_bokförd !== "Bokförd" && (
                      <Knapp
                        text="Bokför"
                        onClick={() => handleBetalaOchBokför(faktura)}
                        className="bg-green-700 hover:bg-green-600 text-xs px-3 py-1"
                      />
                    )}
                    {faktura.status_bokförd === "Bokförd" && (
                      <span className="text-gray-500 text-xs">Bokförd</span>
                    )}
                  </div>
                </td>
                <td className="py-2 text-center">
                  <span
                    onClick={() => taBortFaktura(faktura.id)}
                    className="cursor-pointer text-red-500 hover:text-red-400 text-lg"
                    title="Ta bort leverantörsfaktura"
                  >
                    ❌
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Verifikat Modal */}
      <VerifikatModal
        isOpen={verifikatModal.isOpen}
        onClose={stängVerifikat}
        transaktionId={verifikatModal.transaktionId}
        fakturanummer={verifikatModal.fakturanummer}
        leverantör={verifikatModal.leverantör}
      />

      {/* Bekräftelse Modal för Bokföring */}
      <Modal
        isOpen={bekraftelseModal.isOpen}
        onClose={stängBekraftelseModal}
        title="Bekräfta bokföring"
        maxWidth="lg"
      >
        {bekraftelseModal.faktura && (
          <div className="space-y-4">
            <div className="text-gray-300">
              <p className="mb-4">Du är på väg att bokföra följande leverantörsfaktura:</p>

              {/* Transaktionsposter - Debet/Kredit */}
              <div className="mt-6">
                <h4 className="text-white font-semibold mb-3">Bokföringsposter:</h4>
                {bekraftelseModal.loadingPoster ? (
                  <div className="text-gray-400 text-center py-4">Laddar bokföringsposter...</div>
                ) : bekraftelseModal.transaktionsposter.length > 0 ? (
                  <Tabell
                    data={bekraftelseModal.transaktionsposter}
                    columns={transaktionskolumner}
                    getRowId={(post) => post.id || Math.random()}
                  />
                ) : (
                  <div className="text-gray-400 text-center py-4">
                    Inga bokföringsposter hittades.
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Knapp text="❌ Avbryt" onClick={stängBekraftelseModal} className="px-6 py-2" />
              <Knapp
                text="✓ Bokför"
                onClick={() => utförBokföring(bekraftelseModal.faktura!)}
                className="px-6 py-2"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
