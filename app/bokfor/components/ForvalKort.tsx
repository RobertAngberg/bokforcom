"use client";

import { ForvalKortProps } from "../types/types";
import { useBokforContext } from "./BokforProvider";

export default function ForvalKort({ förval, isHighlighted, onClick }: ForvalKortProps) {
  const { state } = useBokforContext();

  const getCardClassName = (isHighlighted: boolean) => {
    return `cursor-pointer p-4 mb-4 border border-dashed rounded-lg transition-all duration-200 ${
      isHighlighted
        ? "border-gray-500 bg-slate-800"
        : "border-gray-600 bg-slate-900 hover:border-gray-500 hover:bg-slate-800"
    }`;
  };

  const formatKontoValue = (value: number | boolean | null | undefined) => {
    if (value === true) return "✓";
    if (value === false || value === null || value === undefined) return "-";
    if (typeof value === "number") return value.toLocaleString("sv-SE");
    return "-";
  };

  // Skapa lokal state för denna komponent
  const kontonSökord = förval.konton?.map((k: any) => k.kontonummer).join(", ") || "";
  const showEnterHint = isHighlighted;

  return (
    <div className={getCardClassName(isHighlighted)} onClick={onClick}>
      <div className="text-xl text-white mb-2">✓ {förval.namn}</div>
      <pre className="whitespace-pre-wrap text-sm italic text-gray-300 mb-2 font-sans">
        {förval.beskrivning}
      </pre>

      <p className="text-sm text-gray-400">
        <strong>Typ:</strong> {förval.typ} &nbsp; | &nbsp;
        <strong>Kategori:</strong> {förval.kategori}
      </p>

      <p className="text-sm text-gray-500 mt-2 mb-4">
        <strong>Sökord:</strong> {kontonSökord}
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
                {formatKontoValue(konto.debet)}
              </td>
              <td className="border border-gray-700 px-2 py-1 text-center">
                {formatKontoValue(konto.kredit)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showEnterHint && (
        <div className="mt-3 text-xs text-right text-gray-400">⏎ Tryck Enter för att välja</div>
      )}
    </div>
  );
}
