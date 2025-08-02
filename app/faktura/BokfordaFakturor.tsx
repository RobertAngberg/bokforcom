"use client";

import React, { useState, useEffect } from "react";
import { formatSEK } from "../_utils/format";
import { hamtaBokfordaFakturor, hamtaTransaktionsposter, registreraBetalning } from "./actions";
import VerifikatModal from "./VerifikatModal";
import BetalningsbekräftelseModal from "./BetalningsbekraftelseModal";

type BokfordFaktura = {
  id: number; // leverantörsfaktura.id
  transaktionId?: number; // transaktion.id för verifikat
  datum: string;
  belopp: number;
  kommentar: string;
  leverantör?: string;
  fakturanummer?: string;
  fakturadatum?: string;
  förfallodatum?: string;
  betaldatum?: string;
  status_betalning?: string;
  status_bokförd?: string;
};

export default function BokfordaFakturor() {
  const [fakturor, setFakturor] = useState<BokfordFaktura[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifikatModal, setVerifikatModal] = useState<{
    isOpen: boolean;
    transaktionId: number;
    fakturanummer?: string;
    leverantör?: string;
  }>({
    isOpen: false,
    transaktionId: 0,
  });
  const [betalningsModal, setBetalningsModal] = useState<{
    isOpen: boolean;
    faktura: BokfordFaktura | null;
  }>({
    isOpen: false,
    faktura: null,
  });

  useEffect(() => {
    async function hamtaFakturor() {
      try {
        const result = await hamtaBokfordaFakturor();
        if (result.success && result.fakturor) {
          setFakturor(result.fakturor);
        }
      } catch (error) {
        console.error("Fel vid hämtning av bokförda fakturor:", error);
      } finally {
        setLoading(false);
      }
    }

    hamtaFakturor();
  }, []);

  const öppnaVerifikat = (faktura: BokfordFaktura) => {
    setVerifikatModal({
      isOpen: true,
      transaktionId: faktura.transaktionId || faktura.id,
      fakturanummer: faktura.fakturanummer,
      leverantör: faktura.leverantör,
    });
  };

  const stängVerifikat = () => {
    setVerifikatModal({
      isOpen: false,
      transaktionId: 0,
    });
  };

  const handleRegistreraBetalning = async (faktura: BokfordFaktura) => {
    setBetalningsModal({
      isOpen: true,
      faktura: faktura,
    });
  };

  const bekräftaBetalning = async () => {
    if (!betalningsModal.faktura) return;

    try {
      const result = await registreraBetalning(
        betalningsModal.faktura.id,
        betalningsModal.faktura.belopp
      );

      if (result.success) {
        alert("Betalning registrerad!");
        // Stäng modalen
        setBetalningsModal({ isOpen: false, faktura: null });
        // Ladda om data för att visa uppdaterad status
        const updatedData = await hamtaBokfordaFakturor();
        if (updatedData.success) {
          setFakturor(updatedData.fakturor || []);
        }
      } else {
        alert(`Fel vid registrering av betalning: ${result.error}`);
      }
    } catch (error) {
      console.error("Fel vid betalning:", error);
      alert("Ett fel uppstod vid registrering av betalning");
    }
  };

  const stängBetalningsModal = () => {
    setBetalningsModal({ isOpen: false, faktura: null });
  };

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Bokförda fakturor</h2>
        <p className="text-gray-400">Laddar...</p>
      </div>
    );
  }

  if (fakturor.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Bokförda fakturor</h2>
        <p className="text-gray-400">Inga bokförda fakturor hittades.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-4">
        Bokförda fakturor ({fakturor.length})
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left text-gray-300 pb-2">Datum</th>
              <th className="text-left text-gray-300 pb-2">Leverantör/Kund</th>
              <th className="text-left text-gray-300 pb-2">Fakturanr</th>
              <th className="text-left text-gray-300 pb-2">Belopp</th>
              <th className="text-left text-gray-300 pb-2">Betalning</th>
              <th className="text-left text-gray-300 pb-2">Bokförd</th>
              <th className="text-left text-gray-300 pb-2">Kommentar</th>
              <th className="text-center text-gray-300 pb-2">Verifikat</th>
              <th className="text-center text-gray-300 pb-2">Åtgärder</th>
            </tr>
          </thead>
          <tbody>
            {fakturor.map((faktura) => (
              <tr key={faktura.id} className="border-b border-gray-800">
                <td className="py-2 text-white">
                  {new Date(faktura.datum).toLocaleDateString("sv-SE")}
                </td>
                <td className="py-2 text-gray-300">{faktura.leverantör || "-"}</td>
                <td className="py-2 text-gray-300">{faktura.fakturanummer || "-"}</td>
                <td className="py-2 text-white">{formatSEK(faktura.belopp)}</td>
                <td className="py-2">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      faktura.status_betalning === "Betald"
                        ? "bg-green-900 text-green-200"
                        : "bg-red-900 text-red-200"
                    }`}
                  >
                    {faktura.status_betalning || "Obetald"}
                  </span>
                </td>
                <td className="py-2">
                  <span className="px-2 py-1 rounded text-xs bg-blue-900 text-blue-200">
                    {faktura.status_bokförd || "Bokförd"}
                  </span>
                </td>
                <td className="py-2 text-gray-300 max-w-xs truncate">{faktura.kommentar}</td>
                <td className="py-2 text-center">
                  <button
                    onClick={() => öppnaVerifikat(faktura)}
                    className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
                    title="Visa verifikat"
                  >
                    📄 Verifikat
                  </button>
                </td>
                <td className="py-2 text-center">
                  {faktura.status_betalning === "Obetald" ? (
                    <button
                      onClick={() => handleRegistreraBetalning(faktura)}
                      className="px-3 py-1 text-xs bg-green-700 hover:bg-green-600 text-white rounded transition-colors"
                      title="Registrera betalning"
                    >
                      💰 Betala
                    </button>
                  ) : (
                    <span className="text-gray-500 text-xs">Betald</span>
                  )}
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

      {/* Betalningsbekräftelse Modal */}
      <BetalningsbekräftelseModal
        isOpen={betalningsModal.isOpen}
        onClose={stängBetalningsModal}
        onConfirm={bekräftaBetalning}
        leverantör={betalningsModal.faktura?.leverantör || ""}
        fakturanummer={betalningsModal.faktura?.fakturanummer || ""}
        belopp={betalningsModal.faktura?.belopp || 0}
      />
    </div>
  );
}
