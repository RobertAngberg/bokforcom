import { useState, useEffect } from "react";
import { fetchHuvudbokMedAllaTransaktioner, fetchForetagsprofil } from "../actions/huvudbokActions";
import { exportHuvudbokCSV, exportHuvudbokPDF } from "../../_utils/fileUtils";
import { HuvudboksKontoMedTransaktioner, ToastState } from "../types/types";
import { PERIOD_OPTIONS } from "../utils/periodOptions";

export function useHuvudbok() {
  // State
  const [huvudboksdata, setHuvudboksdata] = useState<HuvudboksKontoMedTransaktioner[]>([]);
  const [företagsnamn, setFöretagsnamn] = useState("");
  const [organisationsnummer, setOrganisationsnummer] = useState("");
  const [loading, setLoading] = useState(true);

  // Filter state - endast 2025
  const [selectedYear, setSelectedYear] = useState("2025");
  const [selectedMonth, setSelectedMonth] = useState("all");

  // Modal state
  const [showVerifikatModal, setShowVerifikatModal] = useState(false);
  const [selectedTransaktionsId, setSelectedTransaktionsId] = useState<number | null>(null);

  // Toast state
  const [toast, setToast] = useState<ToastState>(null);

  // Data fetching
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const huvudbokResult = await fetchHuvudbokMedAllaTransaktioner(selectedYear, selectedMonth);
        setHuvudboksdata(huvudbokResult);

        // Försök ladda företagsprofil
        try {
          const profileResult = await fetchForetagsprofil();
          if (profileResult) {
            setFöretagsnamn(profileResult.företagsnamn || "");
            setOrganisationsnummer(profileResult.organisationsnummer || "");
          }
        } catch (profileError) {
          console.log("Kunde inte ladda företagsprofil:", profileError);
          // Inte kritiskt fel, fortsätt utan företagsinfo
        }
      } catch (error) {
        console.error("Fel vid laddning av huvudboksdata:", error);
        setToast({
          type: "error",
          message: "Kunde inte ladda huvudboksdata. Försök igen.",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedYear, selectedMonth]); // Re-load when year or month changes

  // Year options - endast 2025
  const yearOptions = [{ value: "2025", label: "2025" }];

  // Month options - using shared PERIOD_OPTIONS
  const monthOptions = PERIOD_OPTIONS;

  // Filtrera konton efter månad
  const filtreraKontonEfterMånad = (konton: HuvudboksKontoMedTransaktioner[]) => {
    if (selectedMonth === "all") {
      return konton;
    }

    return konton
      .map((konto) => ({
        ...konto,
        transaktioner: konto.transaktioner.filter((transaktion) => {
          const transaktionsDatum = new Date(transaktion.datum);
          const transaktionsMånad = (transaktionsDatum.getMonth() + 1).toString().padStart(2, "0");
          return transaktionsMånad === selectedMonth;
        }),
      }))
      .filter((konto) => konto.transaktioner.length > 0);
  };

  // Kategorisera konton enligt BAS-kontoplan
  const kategoriseraKonton = (konton: HuvudboksKontoMedTransaktioner[]) => {
    const kategorier = [
      { namn: "Tillgångar", pattern: /^1/, konton: [] as HuvudboksKontoMedTransaktioner[] },
      {
        namn: "Eget kapital och skulder",
        pattern: /^2/,
        konton: [] as HuvudboksKontoMedTransaktioner[],
      },
      { namn: "Intäkter", pattern: /^3/, konton: [] as HuvudboksKontoMedTransaktioner[] },
      { namn: "Kostnader", pattern: /^[4-8]/, konton: [] as HuvudboksKontoMedTransaktioner[] },
    ];

    konton.forEach((konto) => {
      const kategori = kategorier.find((k) => k.pattern.test(konto.kontonummer));
      if (kategori) {
        kategori.konton.push(konto);
      }
    });

    return kategorier.filter((k) => k.konton.length > 0);
  };

  // Formatering för SEK med behållet minustecken
  const formatSEKLocal = (val: number): string => {
    if (val === 0) return "0kr";

    const isNegative = val < 0;
    const absVal = Math.abs(val);
    const formatted = absVal.toLocaleString("sv-SE") + "kr";
    return isNegative ? `−${formatted}` : formatted;
  };

  // Modal handlers
  const handleShowVerifikat = async (transaktionsId: number) => {
    console.log("🔍 Visar verifikat för transaktion:", transaktionsId);
    setSelectedTransaktionsId(transaktionsId);
    setShowVerifikatModal(true);
  };

  const handleCloseVerifikatModal = () => {
    setShowVerifikatModal(false);
    setSelectedTransaktionsId(null);
  };

  // Export handlers
  const handleExportCSV = () => {
    try {
      exportHuvudbokCSV(filtradeKonton, företagsnamn, selectedMonth, selectedYear);
      setToast({
        type: "success",
        message: "CSV-fil exporterad framgångsrikt!",
      });
    } catch (error) {
      console.error("Fel vid CSV-export:", error);
      setToast({
        type: "error",
        message: "Ett fel uppstod vid CSV-export. Försök igen.",
      });
    }
  };

  const handleExportPDF = async () => {
    try {
      await exportHuvudbokPDF(
        filtradeKonton,
        företagsnamn,
        organisationsnummer,
        selectedMonth,
        selectedYear
      );
      setToast({
        type: "success",
        message: "PDF-fil exporterad framgångsrikt!",
      });
    } catch (error) {
      console.error("Fel vid PDF-export:", error);
      setToast({
        type: "error",
        message: "Ett fel uppstod vid PDF-export. Försök igen.",
      });
    }
  };

  // Computed values
  const filtradeKonton = filtreraKontonEfterMånad(huvudboksdata);
  const kategoriseradeKonton = kategoriseraKonton(filtradeKonton);

  return {
    // State
    huvudboksdata,
    företagsnamn,
    organisationsnummer,
    loading,
    selectedYear,
    selectedMonth,
    showVerifikatModal,
    selectedTransaktionsId,
    toast,

    // Options
    yearOptions,
    monthOptions,

    // Computed values
    filtradeKonton,
    kategoriseradeKonton,

    // Actions
    setSelectedYear,
    setSelectedMonth,
    setToast,
    handleShowVerifikat,
    handleCloseVerifikatModal,
    handleExportCSV,
    handleExportPDF,

    // Utils
    formatSEKLocal,
  };
}
