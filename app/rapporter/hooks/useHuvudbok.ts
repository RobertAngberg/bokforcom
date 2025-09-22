import { useState, useEffect } from "react";
import { fetchHuvudbokMedAllaTransaktioner, fetchFöretagsprofil } from "../huvudbok/actions";
import { exportHuvudbokCSV, exportHuvudbokPDF } from "../../_utils/fileUtils";

export type TransaktionData = {
  transaktion_id: number;
  datum: string;
  beskrivning: string;
  debet: number | null;
  kredit: number | null;
  verifikatNummer: string;
  belopp: number;
  lopande_saldo: number;
  sort_priority: number;
};

export type HuvudboksKontoMedTransaktioner = {
  kontonummer: string;
  beskrivning: string;
  ingaendeBalans: number;
  utgaendeBalans: number;
  transaktioner: TransaktionData[];
};

export type ToastState = {
  type: "success" | "error" | "info";
  message: string;
} | null;

export function useHuvudbok() {
  // State
  const [huvudboksdata, setHuvudboksdata] = useState<HuvudboksKontoMedTransaktioner[]>([]);
  const [företagsnamn, setFöretagsnamn] = useState("");
  const [organisationsnummer, setOrganisationsnummer] = useState("");
  const [loading, setLoading] = useState(true);

  // Filter state
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState("alla");

  // Modal state
  const [showVerifikatModal, setShowVerifikatModal] = useState(false);
  const [selectedTransaktionsId, setSelectedTransaktionsId] = useState<number | null>(null);

  // Toast state
  const [toast, setToast] = useState<ToastState>(null);

  // Data fetching
  useEffect(() => {
    const loadData = async () => {
      try {
        const huvudbokResult = await fetchHuvudbokMedAllaTransaktioner();
        setHuvudboksdata(huvudbokResult);

        // Försök ladda företagsprofil
        try {
          const profileResult = await fetchFöretagsprofil();
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
  }, []);

  // Year options från 2020 till nu
  const yearOptions = Array.from({ length: currentYear - 2019 }, (_, i) => {
    const year = 2020 + i;
    return { value: year.toString(), label: year.toString() };
  });

  // Month options
  const monthOptions = [
    { value: "alla", label: "Alla månader" },
    { value: "01", label: "Januari" },
    { value: "02", label: "Februari" },
    { value: "03", label: "Mars" },
    { value: "04", label: "April" },
    { value: "05", label: "Maj" },
    { value: "06", label: "Juni" },
    { value: "07", label: "Juli" },
    { value: "08", label: "Augusti" },
    { value: "09", label: "September" },
    { value: "10", label: "Oktober" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  // Filtrera konton efter månad
  const filtreraKontonEfterMånad = (konton: HuvudboksKontoMedTransaktioner[]) => {
    if (selectedMonth === "alla") {
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
  const handleShowVerifikat = (transaktionsId: number) => {
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
