// #region Huvud
"use client";

import React from "react";

type Row = {
  [key: string]: string | number | null | undefined | React.ReactNode;
};

type Props = {
  rows: Row[];
  totalLabel?: string;
  totalValue?: number;
  hideHeader?: boolean;
};
// #endregion

export default function InreTabell({ rows, totalLabel, totalValue, hideHeader = false }: Props) {
  if (rows.length === 0) return null;

  const formatSEK = (val: number) =>
    val.toLocaleString("sv-SE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " kr";

  // Säker text-rendering för att förhindra XSS
  const renderSafeText = (value: any): React.ReactNode => {
    if (React.isValidElement(value)) {
      return value; // Om det redan är en React-komponent
    }
    return String(value || ""); // Konvertera till säker sträng
  };

  const keys = Object.keys(rows[0]);
  const colCount = keys.length;

  function capitalize(text: string) {
    return text.charAt(0).toUpperCase() + text.slice(1).replace(/_/g, " ");
  }

  return (
    <div className="bg-slate-800 rounded-xl p-4 text-white text-sm">
      {/* Header - dölj om hideHeader är true */}
      {!hideHeader && (
        <div
          className="font-semibold border-b border-gray-700 pb-1 mb-1 grid"
          style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
        >
          {keys.map((key) => (
            <div
              key={key}
              className={`${
                typeof rows[0][key] === "number" ? "text-right" : "text-left"
              } break-words`}
            >
              {key === "value" ? "Belopp" : capitalize(key === "transaktionsdatum" ? "datum" : key)}
            </div>
          ))}
        </div>
      )}

      {/* Rows */}
      {rows.map((row, i) => (
        <div
          key={i}
          className="py-1 border-b border-slate-700 last:border-none grid"
          style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
        >
          {keys.map((key) => {
            const val = row[key];
            const isNum = typeof val === "number";
            return (
              <div key={key} className={`${isNum ? "text-right" : "text-left"} break-words`}>
                {isNum ? (
                  formatSEK(val as number)
                ) : val === null || val === undefined ? (
                  <span className="text-gray-400 italic">—</span>
                ) : (
                  renderSafeText(val)
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* Totalrad */}
      {typeof totalValue === "number" && totalLabel && (
        <div className="flex justify-between font-semibold pt-2 mt-2">
          <span>{totalLabel}</span>
          <span>{formatSEK(totalValue)}</span>
        </div>
      )}
    </div>
  );
}
