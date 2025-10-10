import React from "react";
import type { ArbetstidInfoProps } from "../../../../types/types";

const toNumber = (value?: string | number | null) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value.replace(",", "."));
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

export default function ArbetstidInfo({ lönespec, formatNoDecimals }: ArbetstidInfoProps) {
  const arbetadeTimmar = toNumber(lönespec?.arbetade_timmar);
  const övertidTimmar = toNumber(lönespec?.övertid_timmar);
  const sjukfrånvaroDagar = toNumber(lönespec?.sjukfrånvaro_dagar);

  if (!(arbetadeTimmar > 0 || övertidTimmar > 0 || sjukfrånvaroDagar > 0)) return null;

  return (
    <div className="border border-gray-400 rounded p-3 mb-6">
      <h4 className="font-bold mb-2 text-sm text-black">Arbetstid denna period</h4>
      <div className="grid grid-cols-4 gap-3 text-xs">
        {arbetadeTimmar > 0 && (
          <div className="text-center">
            <div className="font-semibold text-black">Arbetade timmar</div>
            <div className="text-sm font-bold text-black">{formatNoDecimals(arbetadeTimmar)}</div>
          </div>
        )}
        {övertidTimmar > 0 && (
          <div className="text-center">
            <div className="font-semibold text-black">Övertid timmar</div>
            <div className="text-sm font-bold text-black">{formatNoDecimals(övertidTimmar)}</div>
          </div>
        )}
        {sjukfrånvaroDagar > 0 && (
          <div className="text-center">
            <div className="font-semibold text-black">Sjukfrånvaro</div>
            <div className="text-sm font-bold text-black">
              {formatNoDecimals(sjukfrånvaroDagar)} dagar
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
