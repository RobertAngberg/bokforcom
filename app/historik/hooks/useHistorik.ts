import { useState } from "react";
import {
  fetchTransactionDetails,
  exporteraTransaktionerMedPoster,
  deleteTransaction,
} from "../actions/actions";
import { HistoryItem, TransactionDetail } from "../types/types";
import { ColumnDefinition } from "../../_components/TabellRad";
import { showToast } from "../../_components/Toast";
import { validateYear } from "../../_utils/validationUtils";

function validateYearInput(year: string): boolean {
  if (!year || typeof year !== "string") return false;
  const yearNum = parseInt(year);
  return validateYear(yearNum);
}

function filterTransactionsBySearch(items: HistoryItem[], searchTerm: string): HistoryItem[] {
  if (!searchTerm) return items;

  const normalizedSearch = searchTerm.toLowerCase();
  if (!normalizedSearch) return items;

  return items.filter((item) => {
    const verifikat = (item.kontobeskrivning || "").toLowerCase();
    const kommentar = (item.kommentar || "").toLowerCase();
    const matchesVerifikat = verifikat.includes(normalizedSearch);
    const matchesComment = kommentar.includes(normalizedSearch);
    const matchesId = item.transaktions_id.toString().includes(normalizedSearch);

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

    // Sedan filtrera på sökning (input saneras centralt i TextFalt)
    return filterTransactionsBySearch(dateFiltered, searchTerm);
  };

  const filteredData = getFilteredData();
  const periodTotals = calculatePeriodTotals(filteredData);

  // Column definitions with business logic
  const columns: ColumnDefinition<HistoryItem>[] = [
    { key: "transaktions_id", label: "ID", paddingClass: "pl-4 pr-3 py-3 md:pl-5 md:pr-4" },
    { key: "transaktionsdatum", label: "Datum", paddingClass: "px-4 py-3" },
    { key: "kontobeskrivning", label: "Verifikat", paddingClass: "px-4 py-3" },
    {
      key: "belopp",
      label: "Belopp",
      render: (_: unknown, item: HistoryItem) => {
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
      paddingClass: "px-4 py-3",
    },
    {
      key: "kommentar",
      label: "Kommentar",
      hiddenOnMobile: true,
      paddingClass: "px-4 py-3",
    },
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
    setSearchTerm(e.target.value);
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
    } catch {
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
    handleExport,
    handleDelete,
    confirmDelete,

    // Setters for UI state
    setShowDeleteModal,
  };
}
