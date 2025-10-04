"use client";

import { useBokforing } from "../../../hooks/useBokforing";
import type { BokforLonerProps } from "../../../types/types";
import Knapp from "../../../../_components/Knapp";

export default function BokforLoner({
  lönespec,
  extrarader,
  beräknadeVärden,
  anställdNamn,
  isOpen,
  onClose,
  onBokfört,
}: BokforLonerProps) {
  // Använd hooken för ALL affärslogik
  const { loading, error, poster, totalDebet, totalKredit, ärBalanserad, handleBokför } =
    useBokforing({
      lönespec,
      extrarader,
      beräknadeVärden,
      anställdNamn,
      onBokfört,
      onClose,
    });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 p-6 rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">📋 Bokföringsposter för Lönespec</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">
            ✕
          </button>
        </div>

        <div className="bg-slate-700 p-4 rounded-lg mb-4">
          <h3 className="text-md font-semibold text-slate-300 mb-2">Lönespec-info</h3>
          <div className="text-sm text-slate-400">
            <p>Grundlön: {Number(beräknadeVärden.grundlön || 0).toLocaleString("sv-SE")} kr</p>
            <p>Bruttolön: {Number(beräknadeVärden.bruttolön || 0).toLocaleString("sv-SE")} kr</p>
            <p>
              Sociala avgifter:{" "}
              {Number(beräknadeVärden.socialaAvgifter || 0).toLocaleString("sv-SE")} kr
            </p>
            <p>Skatt: {Number(beräknadeVärden.skatt || 0).toLocaleString("sv-SE")} kr</p>
            <p>Nettolön: {Number(beräknadeVärden.nettolön || 0).toLocaleString("sv-SE")} kr</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-white">
            <thead>
              <tr className="border-b border-slate-600">
                <th className="text-left p-2">Konto</th>
                <th className="text-left p-2">Beskrivning</th>
                <th className="text-right p-2">Debet</th>
                <th className="text-right p-2">Kredit</th>
              </tr>
            </thead>
            <tbody>
              {poster
                .sort((a, b) => a.konto.localeCompare(b.konto))
                .map((post, i) => (
                  <tr key={i} className="border-b border-slate-700 hover:bg-slate-700">
                    <td className="p-2 font-mono">{post.konto}</td>
                    <td className="p-2">{post.kontoNamn}</td>
                    <td className="p-2 text-right">
                      {post.debet.toLocaleString("sv-SE", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      kr
                    </td>
                    <td className="p-2 text-right">
                      {post.kredit.toLocaleString("sv-SE", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      kr
                    </td>
                  </tr>
                ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-500 font-bold">
                <td className="p-2" colSpan={2}>
                  TOTALT
                </td>
                <td className="p-2 text-right">{totalDebet.toLocaleString("sv-SE")} kr</td>
                <td className="p-2 text-right">{totalKredit.toLocaleString("sv-SE")} kr</td>
              </tr>
              <tr className={ärBalanserad ? "text-green-400" : "text-red-400"}>
                <td className="p-2" colSpan={2}>
                  BALANS
                </td>
                <td className="p-2 text-right" colSpan={2}>
                  {ärBalanserad
                    ? "✅ Balanserad"
                    : `❌ Diff: ${(totalDebet - totalKredit).toFixed(2)} kr`}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-600 text-red-200 p-3 rounded-lg mt-4">
            <p className="font-semibold">❌ Fel vid bokföring:</p>
            <p>{error}</p>
          </div>
        )}

        <div className="flex justify-between items-center mt-6">
          <Knapp text="Avbryt" onClick={onClose} disabled={loading} />

          <div className="flex items-center space-x-3">
            {!ärBalanserad && (
              <div className="text-red-400 text-sm">⚠️ Bokföringen är inte balanserad</div>
            )}

            <Knapp
              text={loading ? "Bokför..." : "📋 Bokför Löneutbetalning"}
              onClick={handleBokför}
              disabled={loading || !ärBalanserad}
              loading={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
