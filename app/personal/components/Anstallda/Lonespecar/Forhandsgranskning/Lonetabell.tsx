import React from "react";
import type { LönetabellProps } from "../../../../types/types";

export default function Lönetabell({
  lönespec,
  bruttolön,
  extraraderMapped,
  formatNoDecimals,
}: LönetabellProps) {
  return (
    <div className="mb-6">
      <table className="w-full border-collapse border border-gray-400">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-400 px-3 py-2 text-left font-bold text-black text-xs">
              Benämning
            </th>
            <th className="border border-gray-400 px-3 py-2 text-center font-bold text-black text-xs">
              Antal
            </th>
            <th className="border border-gray-400 px-3 py-2 text-right font-bold text-black text-xs">
              Kostnad
            </th>
            <th className="border border-gray-400 px-3 py-2 text-right font-bold text-black text-xs">
              Summa
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-400 px-3 py-2 text-black text-xs">Lön</td>
            <td className="border border-gray-400 px-3 py-2 text-center text-black text-xs">
              1 Månad
            </td>
            <td className="border border-gray-400 px-3 py-2 text-right text-black text-xs">
              {formatNoDecimals(bruttolön)} kr
            </td>
            <td className="border border-gray-400 px-3 py-2 text-right font-semibold text-black text-xs">
              {formatNoDecimals(bruttolön)} kr
            </td>
          </tr>
          {parseFloat(lönespec?.övertid || 0) > 0 && (
            <tr>
              <td className="border border-gray-400 px-3 py-2 text-black text-xs">Övertid</td>
              <td className="border border-gray-400 px-3 py-2 text-center text-black text-xs">
                {parseFloat(lönespec.övertid_timmar || 0)} h
              </td>
              <td className="border border-gray-400 px-3 py-2 text-right text-black text-xs">
                {formatNoDecimals(parseFloat(lönespec.övertid))} kr
              </td>
              <td className="border border-gray-400 px-3 py-2 text-right font-semibold text-black text-xs">
                {formatNoDecimals(parseFloat(lönespec.övertid))} kr
              </td>
            </tr>
          )}
          {extraraderMapped.map((rad, i: number) => (
            <tr key={i}>
              <td className="border border-gray-400 px-3 py-2 text-black text-xs">
                {rad.benämning}
              </td>
              <td className="border border-gray-400 px-3 py-2 text-center text-black text-xs">
                {rad.antal ?? ""}
              </td>
              <td className="border border-gray-400 px-3 py-2 text-right text-black text-xs">
                {formatNoDecimals(rad.kostnad)} kr
              </td>
              <td
                className={`border border-gray-400 px-3 py-2 text-right font-semibold text-black text-xs ${rad.summa < 0 ? "text-red-600" : ""}`}
              >
                {formatNoDecimals(rad.summa)} kr
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
