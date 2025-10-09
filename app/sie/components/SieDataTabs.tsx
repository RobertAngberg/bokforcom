"use client";

import { formatCurrency } from "../../_utils/format";
import type { SieData } from "../types/types";

interface SieDataTabsProps {
  sieData: SieData;
  activeTab: "översikt" | "konton" | "verifikationer" | "balanser" | "resultat";
  switchTab: (tab: "översikt" | "konton" | "verifikationer" | "balanser" | "resultat") => void;
  resetPage: () => void;
  currentPage: number;
  goToPage: (page: number) => void;
  getPaginatedData: <T>(data: T[]) => T[];
  getTotalPages: (totalItems: number) => number;
}

export default function SieDataTabs({
  sieData,
  activeTab,
  switchTab,
  resetPage,
  currentPage,
  goToPage,
  getPaginatedData,
  getTotalPages,
}: SieDataTabsProps) {
  const PaginationControls = ({
    totalItems,
    currentPage,
    onPageChange,
  }: {
    totalItems: number;
    currentPage: number;
    onPageChange: (page: number) => void;
  }) => {
    const totalPages = getTotalPages(totalItems);

    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center items-center space-x-2 mt-6">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3 py-2 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:text-gray-500 text-white rounded"
        >
          ← Föregående
        </button>

        <span className="text-white px-4">
          Sida {currentPage} av {totalPages} ({totalItems} objekt)
        </span>

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-2 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:text-gray-500 text-white rounded"
        >
          Nästa →
        </button>
      </div>
    );
  };

  return (
    <>
      {/* Titel för importdata */}
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-white">Importdata</h2>
      </div>

      {/* Flikar */}
      <div className="mb-6">
        <div className="flex justify-center space-x-1 bg-slate-700 p-1 rounded-lg">
          {(["översikt", "konton", "verifikationer", "balanser", "resultat"] as const).map(
            (tab) => (
              <button
                key={tab}
                onClick={() => {
                  switchTab(tab);
                  resetPage();
                }}
                className={`px-4 py-2 rounded-md capitalize transition-colors ${
                  activeTab === tab
                    ? "bg-cyan-600 text-white my-1"
                    : "text-gray-300 hover:text-white hover:bg-slate-600"
                }`}
              >
                {tab}
              </button>
            )
          )}
        </div>
      </div>

      {/* Tab innehåll */}
      {activeTab === "översikt" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-700 rounded-lg p-6 text-center">
              <h3 className="text-lg font-semibold text-white mb-2">Antal Konton</h3>
              <p className="text-3xl font-bold text-cyan-400">{sieData.konton.length}</p>
            </div>
            <div className="bg-slate-700 rounded-lg p-6 text-center">
              <h3 className="text-lg font-semibold text-white mb-2">Antal Verifikationer</h3>
              <p className="text-3xl font-bold text-cyan-400">{sieData.verifikationer.length}</p>
            </div>
            <div className="bg-slate-700 rounded-lg p-6 text-center">
              <h3 className="text-lg font-semibold text-white mb-2">Räkenskapsår</h3>
              <p className="text-lg text-white">
                {sieData.header.räkenskapsår.length > 0 &&
                  `${sieData.header.räkenskapsår[0].startdatum} - ${sieData.header.räkenskapsår[0].slutdatum}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "konton" && (
        <div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-white">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="text-left py-3 px-4">Kontonummer</th>
                  <th className="text-left py-3 px-4">Kontonamn</th>
                </tr>
              </thead>
              <tbody>
                {(
                  getPaginatedData(sieData.konton) as Array<{
                    nummer: string;
                    namn: string;
                  }>
                ).map((konto, index) => (
                  <tr key={index} className="border-b border-slate-700 hover:bg-slate-700">
                    <td className="py-3 px-4">{konto.nummer}</td>
                    <td className="py-3 px-4">{konto.namn}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationControls
            totalItems={sieData.konton.length}
            currentPage={currentPage}
            onPageChange={goToPage}
          />
        </div>
      )}

      {activeTab === "verifikationer" && (
        <div>
          <div className="space-y-4">
            {(
              getPaginatedData(sieData.verifikationer) as Array<{
                serie: string;
                nummer: string;
                datum: string;
                beskrivning: string;
                transaktioner: Array<{ konto: string; belopp: number }>;
              }>
            ).map((ver, index) => (
              <div key={index} className="bg-slate-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-white font-semibold">
                      {ver.serie} {ver.nummer}
                    </h4>
                    <p className="text-gray-300">{ver.beskrivning}</p>
                  </div>
                  <div className="text-gray-300">{ver.datum}</div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-600">
                        <th className="text-left py-2 text-gray-300">Konto</th>
                        <th className="text-right py-2 text-gray-300">Belopp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ver.transaktioner.map((trans, i) => (
                        <tr key={i} className="text-white">
                          <td className="py-1">{trans.konto}</td>
                          <td className="py-1 text-right">{formatCurrency(trans.belopp)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
          <PaginationControls
            totalItems={sieData.verifikationer.length}
            currentPage={currentPage}
            onPageChange={goToPage}
          />
        </div>
      )}

      {activeTab === "balanser" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xl font-semibold text-white mb-4">Ingående Balanser</h3>
            <div className="overflow-x-auto max-h-96">
              <table className="min-w-full text-white text-sm">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="text-left py-2">Konto</th>
                    <th className="text-right py-2">Belopp</th>
                  </tr>
                </thead>
                <tbody>
                  {sieData.balanser.ingående.map((balans, index) => (
                    <tr key={index} className="border-b border-slate-700">
                      <td className="py-2">{balans.konto}</td>
                      <td className="py-2 text-right">{formatCurrency(balans.belopp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-4">Utgående Balanser</h3>
            <div className="overflow-x-auto max-h-96">
              <table className="min-w-full text-white text-sm">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="text-left py-2">Konto</th>
                    <th className="text-right py-2">Belopp</th>
                  </tr>
                </thead>
                <tbody>
                  {sieData.balanser.utgående.map((balans, index) => (
                    <tr key={index} className="border-b border-slate-700">
                      <td className="py-2">{balans.konto}</td>
                      <td className="py-2 text-right">{formatCurrency(balans.belopp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "resultat" && (
        <div>
          <h3 className="text-xl font-semibold text-white mb-4">Resultaträkning</h3>
          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full text-white text-sm">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="text-left py-2">Konto</th>
                  <th className="text-right py-2">Belopp</th>
                </tr>
              </thead>
              <tbody>
                {sieData.resultat.map((resultat, index) => (
                  <tr key={index} className="border-b border-slate-700">
                    <td className="py-2">{resultat.konto}</td>
                    <td className="py-2 text-right">{formatCurrency(resultat.belopp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
