"use client";

import React, { useState, useEffect } from "react";
import { formatSEK } from "../_utils/format";
import { hamtaBokfordaFakturor } from "./actions";

type BokfordFaktura = {
  id: number;
  datum: string;
  belopp: number;
  kommentar: string;
  leverantör?: string;
  fakturanummer?: string;
  fakturadatum?: string;
  förfallodatum?: string;
  betaldatum?: string;
  typ: "leverantor" | "kund";
};

export default function BokfordaFakturor() {
  const [fakturor, setFakturor] = useState<BokfordFaktura[]>([]);
  const [loading, setLoading] = useState(true);

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
              <th className="text-left text-gray-300 pb-2">Typ</th>
              <th className="text-left text-gray-300 pb-2">Leverantör/Kund</th>
              <th className="text-left text-gray-300 pb-2">Fakturanr</th>
              <th className="text-left text-gray-300 pb-2">Belopp</th>
              <th className="text-left text-gray-300 pb-2">Kommentar</th>
            </tr>
          </thead>
          <tbody>
            {fakturor.map((faktura) => (
              <tr key={faktura.id} className="border-b border-gray-800">
                <td className="py-2 text-white">
                  {new Date(faktura.datum).toLocaleDateString("sv-SE")}
                </td>
                <td className="py-2">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      faktura.typ === "leverantor"
                        ? "bg-red-900 text-red-200"
                        : "bg-green-900 text-green-200"
                    }`}
                  >
                    {faktura.typ === "leverantor" ? "Inköp" : "Försäljning"}
                  </span>
                </td>
                <td className="py-2 text-gray-300">{faktura.leverantör || "-"}</td>
                <td className="py-2 text-gray-300">{faktura.fakturanummer || "-"}</td>
                <td className="py-2 text-white">{formatSEK(faktura.belopp)}</td>
                <td className="py-2 text-gray-300 max-w-xs truncate">{faktura.kommentar}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
