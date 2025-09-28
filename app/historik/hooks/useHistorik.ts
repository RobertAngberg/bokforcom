import { useState } from "react";
import {
  fetchTransactionDetails,
  exporteraTransaktionerMedPoster,
  findUnbalancedVerifications,
  deleteTransaction,
} from "../actions/actions";
import { HistoryItem, TransactionDetail, UnbalancedResult } from "../types/types";
import { ColumnDefinition } from "../../_components/TabellRad";
import { showToast } from "../../_components/Toast";

// Business Logic - Migrated from page.tsx
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

export function useHistorik(initialData: HistoryItem[] = []) {
  const [year, setYear] = useState("2025");
  const [month, setMonth] = useState(""); // Tom sträng = alla månader
  const [searchTerm, setSearchTerm] = useState(""); // Nytt sökfält
  const [validationError, setValidationError] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<HistoryItem[]>(initialData);
  const [loading] = useState(false);
  const [detailsMap, setDetailsMap] = useState<Record<number, TransactionDetail[]>>({});
  const [activeIds, setActiveIds] = useState<number[]>([]);
  const [showOnlyUnbalanced, setShowOnlyUnbalanced] = useState(false);
  const [showUnbalancedModal, setShowUnbalancedModal] = useState(false);
  const [isCheckingUnbalanced, setIsCheckingUnbalanced] = useState(false);
  const [unbalancedResults, setUnbalancedResults] = useState<UnbalancedResult[]>([]);
  const [deletingIds, setDeletingIds] = useState<number[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTransactionId, setDeleteTransactionId] = useState<number | null>(null);

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
    const dateFiltered = historyData.filter((item) => {
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

  // Column definitions with business logic
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
        showToast("Fel vid kontroll: " + result.error, "error");
        return;
      }

      if (!result.unbalanced || result.unbalanced.length === 0) {
        showToast("Alla verifikationer är balanserade! ✅", "success");
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
      showToast("Ett fel uppstod vid kontrollen", "error");
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
    setDeleteTransactionId(transactionId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteTransactionId) return;

    setShowDeleteModal(false);
    setDeletingIds((prev) => [...prev, deleteTransactionId]);

    try {
      const result = await deleteTransaction(deleteTransactionId);

      if (result.success) {
        // Ta bort från lokal state
        setHistoryData((prev) =>
          prev.filter((item) => item.transaktions_id !== deleteTransactionId)
        );
        setDetailsMap((prev) => {
          const newMap = { ...prev };
          delete newMap[deleteTransactionId];
          return newMap;
        });
        setActiveIds((prev) => prev.filter((id) => id !== deleteTransactionId));

        showToast(result.message || "Transaktion borttagen", "success");
      } else {
        showToast(result.error || "Kunde inte ta bort transaktion", "error");
      }
    } catch (error) {
      showToast("Ett fel uppstod när transaktionen skulle tas bort", "error");
    } finally {
      setDeletingIds((prev) => prev.filter((id) => id !== deleteTransactionId));
      setDeleteTransactionId(null);
    }
  };

  return {
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
    showDeleteModal,
    deleteTransactionId,

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
    confirmDelete,

    // Setters for UI state
    setShowUnbalancedModal,
    setShowDeleteModal,
  };
}
