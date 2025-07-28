"use client";

import { useState } from "react";

interface FormelVisningProps {
  beräknadeVärden: any;
  extrarader: any[];
  lönespec: any;
}

export default function FormelVisning({
  beräknadeVärden,
  extrarader,
  lönespec,
}: FormelVisningProps) {
  const [visFordlaringar, setVisFordlaringar] = useState(false);

  if (!beräknadeVärden) return null;

  const {
    timlön,
    daglön,
    kontantlön,
    bruttolön,
    skatt,
    socialaAvgifter,
    nettolön,
    lönekostnad,
    dagavdrag,
  } = beräknadeVärden;

  const grundlön = parseFloat(lönespec.grundlön || lönespec.bruttolön || 0);
  const arbetstimmarPerVecka = parseFloat(lönespec.arbetstimmarPerVecka || 40);

  // Standardberäkningar (branschstandard enligt fackförbund)
  const årslön = grundlön * 12;
  const veckor_per_år = 52;
  const standard_timlön = årslön / (veckor_per_år * arbetstimmarPerVecka);
  const standard_daglön = grundlön * 0.046; // 4,6% av månadslönen
  const standard_veckolön = årslön / veckor_per_år;
  const standard_karensavdrag = standard_veckolön * 0.8 * 0.2; // 20% av veckosjuklön

  // Extrarader grupperade
  const positiva_extrarader = extrarader?.filter((rad) => parseFloat(rad.kolumn3 || 0) > 0) || [];
  const negativa_extrarader = extrarader?.filter((rad) => parseFloat(rad.kolumn3 || 0) < 0) || [];

  const totalt_tillägg = positiva_extrarader.reduce(
    (sum, rad) => sum + parseFloat(rad.kolumn3 || 0),
    0
  );
  const totalt_avdrag = Math.abs(
    negativa_extrarader.reduce((sum, rad) => sum + parseFloat(rad.kolumn3 || 0), 0)
  );

  return (
    <div className="bg-slate-700 p-4 rounded-lg mt-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-bold text-white">🧮 Beräkningsformler</h4>
        <button
          onClick={() => setVisFordlaringar(!visFordlaringar)}
          className="text-blue-400 hover:text-blue-300 text-sm px-3 py-1 rounded border border-blue-400 hover:border-blue-300 transition-colors"
        >
          {visFordlaringar ? "🔼 Dölj beräkningar" : "🔽 Visa beräkningar"}
        </button>
      </div>

      {visFordlaringar && (
        <div className="space-y-6 text-sm">
          {/* Grundläggande beräkningar */}
          <div className="bg-slate-800 p-5 rounded-lg border-l-4 border-blue-500">
            <h5 className="text-white font-semibold mb-4 text-base">
              📊 Grundläggande beräkningar (Branschstandard)
            </h5>

            {/* Timlön */}
            <div className="mb-6 bg-slate-700 p-4 rounded">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-medium">Timlön</span>
                <span className="text-blue-300 font-semibold text-lg">
                  {standard_timlön.toFixed(2)} kr
                </span>
              </div>
              <div className="text-gray-300 text-sm mb-3">
                Vi baserar vår timlönsuträkning på samma vis som de flesta fackförbund gör.
              </div>
              <div className="bg-slate-600 p-3 rounded text-gray-200">
                <div className="text-blue-300 mb-2">
                  Formel: månadslön × 12 månader ÷ (52 veckor × arbetstimmar per vecka)
                </div>
                <div>
                  <span className="text-gray-400">Uträkning: </span>
                  {grundlön.toLocaleString("sv-SE")} × 12 ÷ (52 × {arbetstimmarPerVecka}) ={" "}
                  {standard_timlön.toFixed(2)} kr
                </div>
              </div>
            </div>

            {/* Daglön */}
            <div className="mb-6 bg-slate-700 p-4 rounded">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-medium">Daglön</span>
                <span className="text-blue-300 font-semibold text-lg">
                  {standard_daglön.toFixed(0)} kr
                </span>
              </div>
              <div className="text-gray-300 text-sm mb-3">
                Dagslönsuträkning baseras på branschstandard enligt fackförbund. 4,6% av månadslönen
                är ett medelvärde på dagslön om man tar alla arbetsdagar på ett år och delar upp
                dem.
              </div>
              <div className="bg-slate-600 p-3 rounded text-gray-200">
                <div className="text-blue-300 mb-2">Formel: 1 dag = 4,6% × månadslön</div>
                <div>
                  <span className="text-gray-400">Uträkning: </span>1 × 4,6% ×{" "}
                  {grundlön.toLocaleString("sv-SE")} = {standard_daglön.toFixed(0)} kr
                </div>
              </div>
            </div>

            {/* Veckolön */}
            <div className="mb-6 bg-slate-700 p-4 rounded">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-medium">Veckolön</span>
                <span className="text-blue-300 font-semibold text-lg">
                  {standard_veckolön.toFixed(2)} kr
                </span>
              </div>
              <div className="text-gray-300 text-sm mb-3">
                Veckolön är basen för hur man räknar ut sjuklön.
              </div>
              <div className="bg-slate-600 p-3 rounded text-gray-200">
                <div className="text-blue-300 mb-2">Formel: Årslön ÷ veckor per år</div>
                <div>
                  <span className="text-gray-400">Uträkning: </span>(
                  {grundlön.toLocaleString("sv-SE")} × 12) ÷ 52 = {standard_veckolön.toFixed(2)} kr
                </div>
              </div>
            </div>

            {/* Karensavdrag */}
            <div className="mb-6 bg-slate-700 p-4 rounded">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-medium">Karensavdrag</span>
                <span className="text-blue-300 font-semibold text-lg">
                  {standard_karensavdrag.toFixed(2)} kr
                </span>
              </div>
              <div className="text-gray-300 text-sm mb-3">
                Första gången en anställd är sjuk inom en 5-dagarsperiod ska ett karensavdrag göras
                från deras lön. Karensavdraget är 20% av en veckosjuklön.
              </div>
              <div className="bg-slate-600 p-3 rounded text-gray-200">
                <div className="text-blue-300 mb-2">
                  Formel: 20% av veckosjuklön (veckolön × 80%)
                </div>
                <div>
                  <span className="text-gray-400">Uträkning: </span>({standard_veckolön.toFixed(2)}{" "}
                  × 80%) × 20% = {standard_karensavdrag.toFixed(2)} kr
                </div>
              </div>
            </div>
          </div>

          {/* Kontantlön (7210) */}
          <div className="bg-slate-800 p-5 rounded-lg border-l-4 border-green-500">
            <h5 className="text-white font-semibold mb-4 text-base">💰 Kontantlön (Konto 7210)</h5>
            <div className="space-y-4">
              <div className="text-blue-300 text-lg mb-3">
                Kontantlön = Grundlön + Tillägg - Avdrag
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-300">
                <div className="bg-slate-700 p-3 rounded">
                  <div className="text-green-400 font-semibold mb-1">Grundlön:</div>
                  <div className="text-lg">{grundlön.toLocaleString("sv-SE")} kr</div>
                </div>

                {totalt_tillägg > 0 && (
                  <div className="bg-slate-700 p-3 rounded">
                    <div className="text-green-400 font-semibold mb-1">+ Tillägg:</div>
                    <div className="text-lg">+{totalt_tillägg.toLocaleString("sv-SE")} kr</div>
                    <div className="text-xs text-gray-400 mt-2 space-y-1">
                      {positiva_extrarader.map((rad) => (
                        <div key={rad.id}>
                          {rad.kolumn1}: {parseFloat(rad.kolumn3).toLocaleString("sv-SE")} kr
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {totalt_avdrag > 0 && (
                  <div className="bg-slate-700 p-3 rounded">
                    <div className="text-red-400 font-semibold mb-1">- Avdrag:</div>
                    <div className="text-lg">-{totalt_avdrag.toLocaleString("sv-SE")} kr</div>
                    <div className="text-xs text-gray-400 mt-2 space-y-1">
                      {negativa_extrarader.map((rad) => (
                        <div key={rad.id}>
                          {rad.kolumn1}: {Math.abs(parseFloat(rad.kolumn3)).toLocaleString("sv-SE")}{" "}
                          kr
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-600 pt-4 mt-4">
                <div className="flex justify-between items-center text-white font-semibold text-lg bg-slate-700 p-3 rounded">
                  <span>🎯 Kontantlön (Resultat):</span>
                  <span className="text-green-400">{kontantlön?.toLocaleString("sv-SE")} kr</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bruttolön för skatt */}
          <div className="bg-slate-800 p-5 rounded-lg border-l-4 border-yellow-500">
            <h5 className="text-white font-semibold mb-4 text-base">
              📈 Bruttolön (Skattegrundande)
            </h5>
            <div className="space-y-4">
              <div className="text-blue-300 text-lg mb-3">
                Bruttolön = Kontantlön + Skattepliktiga förmåner
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
                <div className="bg-slate-700 p-3 rounded">
                  <div className="text-green-400 font-semibold mb-1">Kontantlön:</div>
                  <div className="text-lg">{kontantlön?.toLocaleString("sv-SE")} kr</div>
                </div>
                <div className="bg-slate-700 p-3 rounded">
                  <div className="text-yellow-400 font-semibold mb-1">
                    + Skattepliktiga förmåner:
                  </div>
                  <div className="text-lg">
                    +{((bruttolön || 0) - (kontantlön || 0)).toLocaleString("sv-SE")} kr
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-600 pt-4 mt-4">
                <div className="flex justify-between items-center text-white font-semibold text-lg bg-slate-700 p-3 rounded">
                  <span>🎯 Bruttolön (Skattegrundande):</span>
                  <span className="text-yellow-400">{bruttolön?.toLocaleString("sv-SE")} kr</span>
                </div>
              </div>
            </div>
          </div>

          {/* Skatt */}
          <div className="bg-slate-800 p-5 rounded-lg border-l-4 border-red-500">
            <h5 className="text-white font-semibold mb-4 text-base">🏛️ Skattberäkning</h5>
            <div className="space-y-4 text-gray-300">
              <div className="text-blue-300 text-lg">
                Skatt beräknas enligt Skattetabell 34 (2025)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-700 p-3 rounded">
                  <div className="text-gray-400 text-sm">Skattegrundande belopp:</div>
                  <div className="text-lg">{bruttolön?.toLocaleString("sv-SE")} kr</div>
                </div>
                <div className="bg-slate-700 p-3 rounded">
                  <div className="text-gray-400 text-sm">Skattetabell/kolumn:</div>
                  <div className="text-lg">
                    {lönespec.skattetabell || "Standard"} / {lönespec.skattekolumn || "1"}
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-600 pt-4 mt-4">
                <div className="flex justify-between items-center text-white font-semibold text-lg bg-slate-700 p-3 rounded">
                  <span>🎯 Beräknad skatt:</span>
                  <span className="text-red-400">{skatt?.toLocaleString("sv-SE")} kr</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sociala avgifter */}
          <div className="bg-slate-800 p-5 rounded-lg border-l-4 border-purple-500">
            <h5 className="text-white font-semibold mb-4 text-base">🏢 Sociala avgifter (2025)</h5>
            <div className="space-y-4 text-gray-300">
              <div className="text-blue-300 text-lg mb-3">
                Sociala avgifter = Bruttolön × 31,42%
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-700 p-3 rounded">
                  <div className="text-gray-400 text-sm">Bruttolön:</div>
                  <div className="text-lg">{bruttolön?.toLocaleString("sv-SE")} kr</div>
                </div>
                <div className="bg-slate-700 p-3 rounded">
                  <div className="text-gray-400 text-sm">Avgiftssats:</div>
                  <div className="text-lg">31,42%</div>
                </div>
              </div>
              <div className="text-xs text-gray-400 bg-slate-700 p-3 rounded">
                <strong>Inkluderar:</strong> Ålderspension (10,21%), Sjukförsäkring (4,35%),
                Föräldraförsäkring (2,60%), Arbetslöshet (2,64%), Arbetsskador (0,30%), Allmän
                löneavgift (11,32%)
              </div>
              <div className="border-t border-gray-600 pt-4 mt-4">
                <div className="flex justify-between items-center text-white font-semibold text-lg bg-slate-700 p-3 rounded">
                  <span>🎯 Sociala avgifter:</span>
                  <span className="text-purple-400">
                    {socialaAvgifter?.toLocaleString("sv-SE")} kr
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Slutresultat */}
          <div className="bg-gradient-to-r from-green-800 to-blue-800 p-5 rounded-lg border-2 border-green-500">
            <h5 className="text-white font-semibold mb-4 text-base">💳 Slutresultat</h5>
            <div className="space-y-4">
              <div className="text-blue-200 text-lg mb-4">
                Nettolön = Kontantlön - Skatt + Skattefria ersättningar
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-100">
                <div className="bg-black bg-opacity-30 p-3 rounded">
                  <div className="text-green-300 font-semibold mb-1">Kontantlön:</div>
                  <div className="text-lg">{kontantlön?.toLocaleString("sv-SE")} kr</div>
                </div>
                <div className="bg-black bg-opacity-30 p-3 rounded">
                  <div className="text-red-300 font-semibold mb-1">- Skatt:</div>
                  <div className="text-lg">-{skatt?.toLocaleString("sv-SE")} kr</div>
                </div>
                <div className="bg-black bg-opacity-30 p-3 rounded">
                  <div className="text-blue-300 font-semibold mb-1">+ Skattefria:</div>
                  <div className="text-lg">
                    +{((nettolön || 0) - (kontantlön || 0) + (skatt || 0)).toLocaleString("sv-SE")}{" "}
                    kr
                  </div>
                </div>
              </div>

              <div className="border-t-2 border-green-400 pt-4 mt-6">
                <div className="bg-black bg-opacity-30 p-4 rounded-lg">
                  <div className="flex justify-between items-center text-white font-bold text-xl mb-2">
                    <span>🏆 Nettolön att betala ut:</span>
                    <span className="text-green-300">{nettolön?.toLocaleString("sv-SE")} kr</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-200 text-lg">
                    <span>💼 Total lönekostnad för företaget:</span>
                    <span className="">{lönekostnad?.toLocaleString("sv-SE")} kr</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bokföringsinformation */}
          <div className="bg-blue-900 p-5 rounded-lg border-l-4 border-blue-400">
            <h5 className="text-white font-semibold mb-4 text-base">
              📚 Bokföringsinformation (Redovisningsstandard)
            </h5>
            <div className="text-sm text-gray-200 space-y-3">
              <div className="bg-blue-800 p-3 rounded">
                <strong className="text-blue-300">7210 Löner till tjänstemän:</strong> Kontantlön (
                {kontantlön?.toLocaleString("sv-SE")} kr)
              </div>
              <div className="bg-blue-800 p-3 rounded">
                <strong className="text-blue-300">7510 Lagstadgade sociala avgifter:</strong>{" "}
                Kontantlön × 31,42% ({(kontantlön! * 0.3142).toFixed(2)} kr)
              </div>
              <div className="bg-blue-800 p-3 rounded">
                <strong className="text-blue-300">7515 Sociala avgifter förmåner:</strong>{" "}
                Skattepliktiga förmåner × 31,42%
              </div>
              <div className="bg-blue-800 p-3 rounded">
                <strong className="text-blue-300">2710 Personalskatt:</strong> Beräknad skatt (
                {skatt?.toLocaleString("sv-SE")} kr)
              </div>
              <div className="bg-blue-800 p-3 rounded">
                <strong className="text-blue-300">1930 Företagskonto:</strong> Nettolön att betala
                ut ({nettolön?.toLocaleString("sv-SE")} kr)
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
