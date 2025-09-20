import React from "react";

export default function Årssammanställning({ bruttolön, skatt, formatNoDecimals }: any) {
  return (
    <div className="border border-gray-400 rounded p-3 mb-6">
      <h4 className="font-bold mb-2 text-sm text-black">Totalt detta år</h4>
      <div className="grid grid-cols-3 gap-6 text-xs">
        <div className="text-center">
          <div className="font-semibold text-black mb-1">Brutto</div>
          <div className="text-sm font-bold text-black">{formatNoDecimals(bruttolön)} kr</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-black mb-1">Förmåner</div>
          <div className="text-sm font-bold text-black">0 kr</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-black mb-1">Skatt</div>
          <div className="text-sm font-bold text-black">{formatNoDecimals(skatt)} kr</div>
        </div>
      </div>
    </div>
  );
}
