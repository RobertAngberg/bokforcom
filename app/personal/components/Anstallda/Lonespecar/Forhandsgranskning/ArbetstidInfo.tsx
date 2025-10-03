import React from "react";
import type { ArbetstidInfoProps } from "../../../../types/types";

export default function ArbetstidInfo({ lönespec, formatNoDecimals }: ArbetstidInfoProps) {
  if (
    !(
      parseFloat(lönespec?.arbetade_timmar || 0) > 0 ||
      parseFloat(lönespec?.övertid_timmar || 0) > 0
    )
  )
    return null;

  return (
    <div className="border border-gray-400 rounded p-3 mb-6">
      <h4 className="font-bold mb-2 text-sm text-black">Arbetstid denna period</h4>
      <div className="grid grid-cols-4 gap-3 text-xs">
        {parseFloat(lönespec?.arbetade_timmar || 0) > 0 && (
          <div className="text-center">
            <div className="font-semibold text-black">Arbetade timmar</div>
            <div className="text-sm font-bold text-black">
              {formatNoDecimals(parseFloat(lönespec.arbetade_timmar))}
            </div>
          </div>
        )}
        {parseFloat(lönespec?.övertid_timmar || 0) > 0 && (
          <div className="text-center">
            <div className="font-semibold text-black">Övertid timmar</div>
            <div className="text-sm font-bold text-black">
              {formatNoDecimals(parseFloat(lönespec.övertid_timmar))}
            </div>
          </div>
        )}
        {parseFloat(lönespec?.sjukfrånvaro_dagar || 0) > 0 && (
          <div className="text-center">
            <div className="font-semibold text-black">Sjukfrånvaro</div>
            <div className="text-sm font-bold text-black">
              {formatNoDecimals(parseFloat(lönespec.sjukfrånvaro_dagar))} dagar
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
