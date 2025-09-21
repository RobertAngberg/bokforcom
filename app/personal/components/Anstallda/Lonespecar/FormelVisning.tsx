"use client";

import type { FormelVisningProps } from "../../../types/types";

export default function FormelVisning({
  beräknadeVärden,
  extrarader,
  lönespec,
}: FormelVisningProps) {
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
        <h4 className="text-lg font-bold text-white">📊 Beräkningsformler</h4>
      </div>

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
              är ett medelvärde på dagslön om man tar alla arbetsdagar på ett år och delar upp dem.
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
              <div className="text-blue-300 mb-2">Formel: 20% av veckosjuklön (veckolön × 80%)</div>
              <div>
                <span className="text-gray-400">Uträkning: </span>({standard_veckolön.toFixed(2)} ×
                80%) × 20% = {standard_karensavdrag.toFixed(2)} kr
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
