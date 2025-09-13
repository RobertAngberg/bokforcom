"use client";

import { ForvalKortProps } from "../_types/types";

export default function FörvalKort({ förval, isHighlighted, onClick }: ForvalKortProps) {
  return (
    <div
      className={`relative rounded-xl p-4 transition-all duration-200 shadow-md cursor-pointer ${
        isHighlighted
          ? "border-2 border-dashed border-gray-500 bg-slate-800"
          : "border border-gray-700 bg-slate-900"
      }`}
      onClick={onClick}
    >
      <div className="text-xl font-semibold text-white mb-2">✓ {förval.namn}</div>
      <pre className="whitespace-pre-wrap text-sm italic text-gray-300 mb-2 font-sans">
        {förval.beskrivning}
      </pre>

      <p className="text-sm text-gray-400">
        <strong>Typ:</strong> {förval.typ} &nbsp; | &nbsp;
        <strong>Kategori:</strong> {förval.kategori}
      </p>

      <p className="text-sm text-gray-500 mt-2 mb-4">
        <strong>Sökord:</strong> {förval.sökord.join(", ")}
      </p>

      <table className="w-full border border-gray-700 text-sm text-gray-300">
        <thead className="bg-slate-800 text-white">
          <tr>
            <th className="border border-gray-700 px-2 py-1 text-left">Konto</th>
            <th className="border border-gray-700 px-2 py-1 text-center">Debet</th>
            <th className="border border-gray-700 px-2 py-1 text-center">Kredit</th>
          </tr>
        </thead>
        <tbody>
          {(förval.konton || []).map((konto, i) => (
            <tr key={i}>
              <td className="border border-gray-700 px-2 py-1">
                {konto.kontonummer} {konto.beskrivning}
              </td>
              <td className="border border-gray-700 px-2 py-1 text-center">
                {konto.debet === true ? "✓" : (konto.debet ?? "")}
              </td>
              <td className="border border-gray-700 px-2 py-1 text-center">
                {konto.kredit === true ? "✓" : (konto.kredit ?? "")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isHighlighted && (
        <div className="mt-3 text-xs text-right text-gray-400">⏎ Tryck Enter för att välja</div>
      )}
    </div>
  );
}
