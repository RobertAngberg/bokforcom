"use client";

import React from "react";
import Tabell from "../../_components/Tabell";
import { ColumnDefinition } from "../../_components/TabellRad";
import MainLayout from "../../_components/MainLayout";
import { HistoryItem, TransactionDetail } from "../types/types";
import { useHistorik } from "../hooks/useHistorik";
import Dropdown from "../../_components/Dropdown";
import Knapp from "../../_components/Knapp";
import Modal from "../../_components/Modal";

export default function Historik() {
  const {
    // State
    year,
    month,
    searchTerm,
    validationError,
    loading,
    activeIds,
    showOnlyUnbalanced,
    showUnbalancedModal,
    isCheckingUnbalanced,
    unbalancedResults,
    deletingIds,

    // Computed values
    filteredData,
    periodTotals,
    detailsMap,
    columns,

    // Handlers
    handleYearChange,
    handleMonthChange,
    handleSearchChange,
    handleRowClick,
    handleUnbalancedCheck,
    handleExport,
    handleDelete,

    // Setters
    setShowUnbalancedModal,
  } = useHistorik();

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center">
          <h1 className="text-3xl mb-8">Historik</h1>
          <div>Laddar...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="text-center mb-8 space-y-4">
        <h1 className="text-3xl">Historik</h1>
        <div className="flex justify-center gap-4 flex-wrap">
          <div className="w-24">
            <Dropdown
              value={year}
              onChange={handleYearChange}
              placeholder="År"
              options={[
                { label: "2025", value: "2025" },
                { label: "2024", value: "2024" },
                { label: "2023", value: "2023" },
                { label: "2022", value: "2022" },
                { label: "2021", value: "2021" },
                { label: "2020", value: "2020" },
              ]}
            />
          </div>
          <div className="w-28">
            <Dropdown
              value={month}
              onChange={handleMonthChange}
              placeholder="Månad"
              options={[
                { label: "Alla", value: "" },
                { label: "Jan", value: "01" },
                { label: "Feb", value: "02" },
                { label: "Mar", value: "03" },
                { label: "Apr", value: "04" },
                { label: "Maj", value: "05" },
                { label: "Jun", value: "06" },
                { label: "Jul", value: "07" },
                { label: "Aug", value: "08" },
                { label: "Sep", value: "09" },
                { label: "Okt", value: "10" },
                { label: "Nov", value: "11" },
                { label: "Dec", value: "12" },
              ]}
            />
          </div>
          <div className="w-40">
            <input
              type="text"
              placeholder="🔍 Sök..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full px-3 py-2 bg-gray-800 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 transition-all duration-200"
            />
          </div>
          <div className="border border-slate-500 rounded-lg px-3 py-2 bg-gray-800 h-[44px]">
            <div className="flex items-center text-slate-400 text-sm gap-2 h-full">
              <span>📄</span>
              <span>{filteredData.length} transaktioner</span>
            </div>
          </div>
          <div>
            <Knapp
              text={showOnlyUnbalanced ? "🔙 Visa alla" : "⚖️ Kolla obalanserade"}
              onClick={handleUnbalancedCheck}
              loading={isCheckingUnbalanced}
              loadingText="🔄 Kollar verifikationer..."
            />
          </div>
        </div>

        {validationError && (
          <div className="text-red-500 text-sm text-center mb-4">{validationError}</div>
        )}

        <div className="pt-2"></div>
      </div>

      <Tabell
        data={filteredData}
        columns={columns}
        getRowId={(item: HistoryItem) => item.transaktions_id}
        activeIds={activeIds}
        handleRowClick={handleRowClick}
        renderExpandedRow={(item: HistoryItem) => {
          const rows = detailsMap[item.transaktions_id] ?? [];
          if (rows.length === 0) return null;

          // Kolumndefinitioner för expanderad tabell
          const detailColumns: ColumnDefinition<TransactionDetail>[] = [
            {
              key: "kontonummer",
              label: "Konto",
              render: (_, detail) => (
                <>
                  <span className="text-sm">{detail.kontonummer}</span> – {detail.beskrivning}
                </>
              ),
            },
            {
              key: "debet",
              label: "Debet",
              render: (value) =>
                value > 0
                  ? value.toLocaleString("sv-SE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }) + " kr"
                  : "—",
              className: "text-right",
            },
            {
              key: "kredit",
              label: "Kredit",
              render: (value) =>
                value > 0
                  ? value.toLocaleString("sv-SE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }) + " kr"
                  : "—",
              className: "text-right",
            },
          ];

          return (
            <tr className="bg-gray-800">
              <td colSpan={5} className="p-0">
                <div className="p-4">
                  <h4 className="text-sm font-semibold mb-3 text-gray-300">
                    📋 {item.kontobeskrivning.replace("Verifikation ", "")}
                  </h4>

                  <Tabell
                    data={rows}
                    columns={detailColumns}
                    getRowId={(detail) => detail.transaktionspost_id}
                  />

                  <div className="pt-4 flex gap-2">
                    {item.blob_url && (
                      <Knapp
                        text="👁️ Se verifikat"
                        onClick={() => window.open(item.blob_url, "_blank")}
                      />
                    )}
                    <Knapp
                      text={
                        deletingIds.includes(item.transaktions_id) ? "Tar bort..." : "🗑️ Ta bort"
                      }
                      onClick={() => handleDelete(item.transaktions_id)}
                      disabled={deletingIds.includes(item.transaktions_id)}
                    />
                  </div>
                </div>
              </td>
            </tr>
          );
        }}
      />

      {/* Modal för obalanserade verifikationer */}
      <Modal
        isOpen={showUnbalancedModal}
        onClose={() => setShowUnbalancedModal(false)}
        title="⚖️ Obalanserade Verifikationer"
        maxWidth="4xl"
      >
        <div className="space-y-4">
          <div className="text-center text-lg font-semibold text-red-400 mb-6">
            🚨 Hittade {unbalancedResults.length} obalanserade verifikationer
          </div>

          <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-4 mb-4">
            <div className="text-yellow-200 text-sm">
              <span className="font-semibold">💡 Tips:</span> Obalanserade verifikationer beror ofta
              på SIE-import med dimensioner. Kontrollera ursprungsfilen eller justera manuellt.
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {unbalancedResults.map(({ item, totalDebet, totalKredit, skillnad }) => (
              <div
                key={item.transaktions_id}
                className="bg-gray-800/50 p-5 rounded-lg border border-gray-600/50 hover:border-gray-500/70 transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-lg font-semibold text-white mb-1">
                      #{item.transaktions_id} - {item.kontobeskrivning.replace("Verifikation ", "")}
                    </div>
                    <div className="text-sm text-gray-400 mb-1">
                      {new Date(item.transaktionsdatum).toLocaleDateString("sv-SE")}
                    </div>
                    {item.kommentar && (
                      <div className="text-sm text-gray-300">{item.kommentar}</div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-gray-700/30 rounded border border-gray-600/40">
                    <div className="text-gray-300 font-medium mb-1 text-sm">Debet</div>
                    <div className="text-base font-semibold text-white">
                      {totalDebet.toLocaleString("sv-SE", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      kr
                    </div>
                  </div>
                  <div className="text-center p-3 bg-gray-700/30 rounded border border-gray-600/40">
                    <div className="text-gray-300 font-medium mb-1 text-sm">Kredit</div>
                    <div className="text-base font-semibold text-white">
                      {totalKredit.toLocaleString("sv-SE", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      kr
                    </div>
                  </div>
                  <div className="text-center p-3 bg-gray-700/40 rounded border border-gray-500/50">
                    <div className="text-gray-300 font-medium mb-1 text-sm">Skillnad</div>
                    <div className="text-base font-bold text-red-300">
                      {skillnad.toLocaleString("sv-SE", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      kr
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-6">
            <Knapp text="Stäng" onClick={() => setShowUnbalancedModal(false)} />
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
