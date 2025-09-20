import React from "react";

export default function SemesterInfo({ lönespec, anställd, formatNoDecimals }: any) {
  return (
    <div className="border border-gray-400 rounded p-3">
      <h4 className="font-bold mb-2 text-black text-sm">Semesterdagar</h4>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="text-center">
          <div className="font-semibold text-black">Betalda</div>
          <div className="text-sm font-bold text-black">
            {formatNoDecimals(parseFloat(lönespec?.semester_uttag || 0))}
          </div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-black">Sparade</div>
          <div className="text-sm font-bold text-black">
            {formatNoDecimals(parseFloat(anställd?.sparade_dagar || 0))}
          </div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-black">Förskott</div>
          <div className="text-sm font-bold text-black">
            {formatNoDecimals(parseFloat(anställd?.använda_förskott || 0))}
          </div>
        </div>
      </div>
    </div>
  );
}
