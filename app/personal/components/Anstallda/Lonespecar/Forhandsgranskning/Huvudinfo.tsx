import React from "react";

export default function Huvudinfo({ anställd, månadsNamn, periodStart, periodSlut }: any) {
  return (
    <>
      {/* Anställd info - Header högerställd */}
      <div className="text-right mb-6 pb-4">
        <div className="text-lg font-bold mb-2 text-black">
          {anställd.efternamn?.toUpperCase()}, {anställd.förnamn?.toUpperCase()}
        </div>
        <div className="text-xs space-y-0.5 text-black">
          <div>{anställd.adress}</div>
          <div>
            {anställd.postnummer} {anställd.ort}
          </div>
        </div>
      </div>
      {/* Lönespec titel och period */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-5 text-black">
          LÖNESPECIFIKATION för {månadsNamn.toLowerCase()}
        </h1>
        <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto text-xs">
          <div className="text-center">
            <div className="font-semibold text-black">Personnummer</div>
            <div className="text-black">({anställd.personnummer})</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-black">Bankkonto</div>
            <div className="text-black">
              {anställd.clearingnummer}-{anställd.bankkonto}
            </div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-black">Löneperiod</div>
            <div className="text-black">
              {periodStart.toLocaleDateString("sv-SE")} - {periodSlut.toLocaleDateString("sv-SE")}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
