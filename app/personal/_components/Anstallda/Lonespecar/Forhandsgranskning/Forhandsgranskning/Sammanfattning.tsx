import React from "react";

export default function Sammanfattning({
  totalLönekostnad,
  bruttolön,
  socialaAvgifter,
  skatt,
  extraraderMapped,
  formatNoDecimals,
  utbetalningsDatum,
  nettolön,
}: any) {
  return (
    <div className="space-y-3">
      <div className="border border-gray-400 rounded p-3">
        <h4 className="font-bold mb-2 text-sm text-black">Totalt</h4>
        <div className="space-y-1.5">
          <div className="flex justify-between text-black text-xs">
            <span className="font-semibold">Lönekostnad</span>
            <span className="font-bold">{formatNoDecimals(totalLönekostnad)} kr</span>
          </div>
          <div className="flex justify-between text-black text-xs">
            <span className="font-semibold">Bruttolön</span>
            <span className="font-bold">{formatNoDecimals(bruttolön)} kr</span>
          </div>
          <div className="flex justify-between text-xs text-black">
            <span>varav sociala avgifter</span>
            <span>{formatNoDecimals(socialaAvgifter)} kr</span>
          </div>
          <div className="flex justify-between text-xs text-black">
            <span>varav Skatt</span>
            <span>{formatNoDecimals(skatt)} kr</span>
          </div>
          {extraraderMapped.length > 0 && (
            <div className="pt-2">
              {extraraderMapped.map((rad: any, i: number) => (
                <div className="flex justify-between text-xs text-black" key={i}>
                  <span>{rad.benämning}</span>
                  <span className={rad.summa < 0 ? "text-red-600" : ""}>
                    {formatNoDecimals(rad.summa)} kr
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="border border-gray-400 rounded p-3 bg-green-50">
        <div className="text-xs mb-1 text-black">
          Utbetalas: {utbetalningsDatum.toLocaleDateString("sv-SE")}
        </div>
        <div className="flex justify-between items-center">
          <span className="font-bold text-sm text-black">Nettolön</span>
          <span className="text-xl font-bold text-green-700">{formatNoDecimals(nettolön)} kr</span>
        </div>
      </div>
    </div>
  );
}
