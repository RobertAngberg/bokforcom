"use client";

import React, { useState, useEffect } from "react";
import Tabell from "../_components/Tabell";
import { ColumnDefinition } from "../_components/TabellRad";
import MainLayout from "../_components/MainLayout";
import {
  fetchTransaktioner,
  fetchTransactionDetails,
  exporteraTransaktionerMedPoster,
  findUnbalancedVerifications,
  deleteTransaction,
} from "./actions";
import Dropdown from "../_components/Dropdown";
import Knapp from "../_components/Knapp";
import Modal from "../_components/Modal";

// Business Logic - Migrated from actions.ts
function sanitizeHistorikInput(text: string): string {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(/[<>&"'{}()[\]]/g, "") // Ta bort XSS-farliga tecken
    .replace(/\s+/g, " ") // Normalisera whitespace
    .trim()
    .substring(0, 100); // Begränsa längd
}

function validateYearInput(year: string): boolean {
  if (!year || typeof year !== "string") return false;
  const yearNum = parseInt(year);
  return !isNaN(yearNum) && yearNum >= 2020 && yearNum <= 2030;
}

function filterTransactionsBySearch(items: HistoryItem[], searchTerm: string): HistoryItem[] {
  if (!searchTerm) return items;

  const sanitizedSearch = sanitizeHistorikInput(searchTerm).toLowerCase();
  if (!sanitizedSearch) return items;

  return items.filter((item) => {
    const matchesVerifikat = sanitizeHistorikInput(item.kontobeskrivning)
      .toLowerCase()
      .includes(sanitizedSearch);
    const matchesComment = sanitizeHistorikInput(item.kommentar || "")
      .toLowerCase()
      .includes(sanitizedSearch);
    const matchesId = item.transaktions_id.toString().includes(sanitizedSearch);

    return matchesVerifikat || matchesComment || matchesId;
  });
}

function calculatePeriodTotals(items: HistoryItem[]): {
  totalDebet: number;
  totalKredit: number;
  count: number;
} {
  return items.reduce(
    (acc, item) => ({
      totalDebet: acc.totalDebet + (item.belopp > 0 ? item.belopp : 0),
      totalKredit: acc.totalKredit + (item.belopp < 0 ? Math.abs(item.belopp) : 0),
      count: acc.count + 1,
    }),
    { totalDebet: 0, totalKredit: 0, count: 0 }
  );
}

function isValidDateRange(year: string, month: string): boolean {
  if (!validateYearInput(year)) return false;
  if (month && (!/^\d{2}$/.test(month) || parseInt(month) < 1 || parseInt(month) > 12)) {
    return false;
  }
  return true;
}

export interface HistoryItem {
  transaktions_id: number;
  transaktionsdatum: string;
  kontobeskrivning: string;
  belopp: number;
  kommentar?: string;
  fil?: string;
  blob_url?: string;
}

export interface TransactionDetail {
  transaktionspost_id: number;
  kontonummer: string;
  beskrivning: string;
  debet: number;
  kredit: number;
}

export default function Page() {
  const [year, setYear] = useState("2025");
  const [month, setMonth] = useState(""); // Tom sträng = alla månader
  const [searchTerm, setSearchTerm] = useState(""); // Nytt sökfält
  const [validationError, setValidationError] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsMap, setDetailsMap] = useState<Record<number, TransactionDetail[]>>({});
  const [activeIds, setActiveIds] = useState<number[]>([]);
  const [showOnlyUnbalanced, setShowOnlyUnbalanced] = useState(false);
  const [showUnbalancedModal, setShowUnbalancedModal] = useState(false);
  const [isCheckingUnbalanced, setIsCheckingUnbalanced] = useState(false);
  const [unbalancedResults, setUnbalancedResults] = useState<
    Array<{
      item: HistoryItem;
      totalDebet: number;
      totalKredit: number;
      skillnad: number;
    }>
  >([]);
  const [deletingIds, setDeletingIds] = useState<number[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await fetchTransaktioner();

        const formattedData =
          result.success && Array.isArray(result.data)
            ? result.data.map((item: any) => ({
                transaktions_id: item.id,
                transaktionsdatum: new Date(item.transaktionsdatum).toISOString().slice(0, 10),
                kontobeskrivning: item.kontobeskrivning || "",
                belopp: item.belopp ?? 0,
                kommentar: item.kommentar ?? "",
                fil: item.fil ?? "",
                blob_url: item.blob_url ?? "",
              }))
            : [];

        const sortedData = [...formattedData].sort((a, b) => {
          // Sortera efter datum DESC, sedan ID DESC
          const dateCompare =
            new Date(b.transaktionsdatum).getTime() - new Date(a.transaktionsdatum).getTime();
          if (dateCompare !== 0) return dateCompare;
          return b.transaktions_id - a.transaktions_id;
        });

        setHistoryData(sortedData);
      } catch (error) {
        // Fel vid laddning av data
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Validera inputs och visa fel i realtid
  const validateInputs = (yearValue: string, monthValue: string): string | null => {
    if (!isValidDateRange(yearValue, monthValue)) {
      if (!validateYearInput(yearValue)) {
        return "Ogiltigt år (måste vara mellan 2020-2030)";
      }
      if (
        monthValue &&
        (!/^\d{2}$/.test(monthValue) || parseInt(monthValue) < 1 || parseInt(monthValue) > 12)
      ) {
        return "Ogiltig månad (måste vara 01-12)";
      }
    }
    return null;
  };

  // Förbättrad filtrering med migerade funktioner
  const getFilteredData = (): HistoryItem[] => {
    // Först filtrera på datum
    let dateFiltered = historyData.filter((item) => {
      const itemYear = item.transaktionsdatum.slice(0, 4);
      const itemMonth = item.transaktionsdatum.slice(5, 7);

      if (itemYear !== year) return false;
      if (month && itemMonth !== month) return false;
      return true;
    });

    // Sedan filtrera på sökning med sanitering
    let searchFiltered = filterTransactionsBySearch(dateFiltered, searchTerm);

    // Om vi bara ska visa obalanserade, filtrera på det
    if (showOnlyUnbalanced) {
      searchFiltered = searchFiltered.filter((item) => {
        const details = detailsMap[item.transaktions_id];
        if (!details) return false;

        const totalDebet = details.reduce((sum, d) => sum + (d.debet || 0), 0);
        const totalKredit = details.reduce((sum, d) => sum + (d.kredit || 0), 0);
        const skillnad = Math.abs(totalDebet - totalKredit);

        return skillnad > 0.01;
      });
    }

    return searchFiltered;
  };

  const filteredData = getFilteredData();
  const periodTotals = calculatePeriodTotals(filteredData);

  // Event handlers med validering
  const handleYearChange = (newYear: string) => {
    const error = validateInputs(newYear, month);
    setValidationError(error);
    if (!error) {
      setYear(newYear);
    }
  };

  const handleMonthChange = (newMonth: string) => {
    const error = validateInputs(year, newMonth);
    setValidationError(error);
    if (!error) {
      setMonth(newMonth);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitizedSearch = sanitizeHistorikInput(e.target.value);
    setSearchTerm(sanitizedSearch);
  };

  const handleRowClick = (id: string | number) => {
    const numericId = typeof id === "string" ? parseInt(id) : id;

    void (async () => {
      if (activeIds.includes(numericId)) {
        // Stäng denna rad (ta bort från array)
        setActiveIds((prev) => prev.filter((id) => id !== numericId));
      } else {
        // Öppna denna rad (lägg till i array)
        setActiveIds((prev) => [...prev, numericId]);
        if (!detailsMap[numericId]) {
          const detailResult = await fetchTransactionDetails(numericId);
          setDetailsMap((prev) => ({ ...prev, [numericId]: detailResult }));
        }
      }
    })();
  };

  const handleUnbalancedCheck = async () => {
    if (showOnlyUnbalanced) {
      setShowOnlyUnbalanced(false);
      return;
    }

    setIsCheckingUnbalanced(true);

    try {
      // 🚀 EN ENDA DATABASFÖRFRÅGAN istället för hundratals!
      const result = await findUnbalancedVerifications();

      if (!result.success) {
        alert("Fel vid kontroll: " + result.error);
        return;
      }

      if (!result.unbalanced || result.unbalanced.length === 0) {
        alert("Alla verifikationer är balanserade! ✅");
        return;
      }

      // Konvertera till vårt format
      const unbalancedItems = result.unbalanced.map((item) => ({
        item: {
          transaktions_id: item.transaktions_id,
          transaktionsdatum: item.transaktionsdatum,
          kontobeskrivning: item.kontobeskrivning,
          kommentar: item.kommentar,
          belopp: item.totalDebet, // Placeholder
        } as HistoryItem,
        totalDebet: item.totalDebet,
        totalKredit: item.totalKredit,
        skillnad: item.skillnad,
      }));

      setUnbalancedResults(unbalancedItems);
      setShowUnbalancedModal(true);
    } catch (error) {
      alert("Ett fel uppstod vid kontrollen");
    } finally {
      setIsCheckingUnbalanced(false);
    }
  };

  const handleExport = async () => {
    const exportData = await exporteraTransaktionerMedPoster(year);

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `transaktioner_${year}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (transactionId: number) => {
    if (!confirm("Är du säker på att du vill ta bort denna transaktion? Detta kan inte ångras.")) {
      return;
    }

    setDeletingIds((prev) => [...prev, transactionId]);

    try {
      const result = await deleteTransaction(transactionId);

      if (result.success) {
        // Ta bort från lokal state
        setHistoryData((prev) => prev.filter((item) => item.transaktions_id !== transactionId));
        setDetailsMap((prev) => {
          const newMap = { ...prev };
          delete newMap[transactionId];
          return newMap;
        });
        setActiveIds((prev) => prev.filter((id) => id !== transactionId));

        alert(result.message || "Transaktion borttagen");
      } else {
        alert(result.error || "Kunde inte ta bort transaktion");
      }
    } catch (error) {
      alert("Ett fel uppstod när transaktionen skulle tas bort");
    } finally {
      setDeletingIds((prev) => prev.filter((id) => id !== transactionId));
    }
  };

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

  const columns: ColumnDefinition<HistoryItem>[] = [
    { key: "transaktions_id", label: "ID" },
    { key: "transaktionsdatum", label: "Datum" },
    { key: "kontobeskrivning", label: "Verifikat" },
    {
      key: "belopp",
      label: "Belopp",
      render: (_: number, item: HistoryItem) => {
        // Summera debet från detailsMap om finns, annars visa originalvärde
        const details = detailsMap[item.transaktions_id];
        let debetSum = item.belopp;
        if (details && details.length > 0) {
          debetSum = details.reduce((sum, d) => sum + (d.debet || 0), 0);
        }
        return debetSum.toLocaleString("sv-SE", {
          style: "currency",
          currency: "SEK",
        });
      },
    },
    { key: "kommentar", label: "Kommentar", hiddenOnMobile: true },
  ];

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
