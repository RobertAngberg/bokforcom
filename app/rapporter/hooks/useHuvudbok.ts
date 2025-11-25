import { useState, useMemo } from "react";
import { exportHuvudbokCSV, exportHuvudbokPDF } from "../utils/csvExport";
import type { HuvudboksKontoMedTransaktioner, ToastState, UseHuvudbokProps } from "../types/types";
import { PERIOD_OPTIONS } from "../utils/periodOptions";
import { formatCurrency } from "../../_utils/format";

export function useHuvudbok({ data, foretagsprofil }: UseHuvudbokProps) {
  // State
  const loading = false;

  // Filter state - endast 2025
  const [selectedYear] = useState("2025");
  const [selectedMonth, setSelectedMonth] = useState("all");

  // Modal state
  const [showVerifikatModal, setShowVerifikatModal] = useState(false);
  const [selectedTransaktionsId, setSelectedTransaktionsId] = useState<number | null>(null);

  // Toast state
  const [toast, setToast] = useState<ToastState>(null);

  // Konvertera TransaktionsPost[] till HuvudboksKontoMedTransaktioner[]
  const huvudboksdata = useMemo(() => {
    const kontoMap = new Map<string, HuvudboksKontoMedTransaktioner>();

    data.forEach((post) => {
      if (!kontoMap.has(post.kontonummer)) {
        kontoMap.set(post.kontonummer, {
          kontonummer: post.kontonummer,
          beskrivning: post.kontobeskrivning,
          ingaendeBalans: 0,
          utgaendeBalans: 0,
          transaktioner: [],
        });
      }

      const konto = kontoMap.get(post.kontonummer)!;

      // Lägg till transaktion
      konto.transaktioner.push({
        transaktion_id: post.transaktions_id,
        datum: post.transaktionsdatum,
        verifikatNummer: post.ar_oppningsbalans ? "Ingående balans" : `V${post.transaktions_id}`,
        beskrivning: post.kontobeskrivning_transaktion,
        debet: post.debet,
        kredit: post.kredit,
        belopp: post.debet - post.kredit,
        lopande_saldo: 0, // Beräknas nedan
        sort_priority: post.ar_oppningsbalans ? 1 : 2,
      });
    });

    // Beräkna ingående/utgående balans och löpande saldo för varje konto
    kontoMap.forEach((konto) => {
      // Sortera transaktioner: ingående balans först, sedan efter datum
      konto.transaktioner.sort((a, b) => {
        if (a.sort_priority !== b.sort_priority) return a.sort_priority - b.sort_priority;
        return new Date(a.datum).getTime() - new Date(b.datum).getTime();
      });

      let lopandeSaldo = 0;
      konto.transaktioner.forEach((trans) => {
        const debet = trans.debet ?? 0;
        const kredit = trans.kredit ?? 0;

        // RAW bokföringssaldo: alltid debet - kredit
        // Detta ger negativt för skulder/intäkter (där kredit > debet)
        // och positivt för tillgångar/kostnader (där debet > kredit)
        lopandeSaldo += debet - kredit;
        trans.lopande_saldo = lopandeSaldo;

        // Ingående balans = första transaktionens saldo (om det är en öppningsbalans)
        if (trans.sort_priority === 1) {
          konto.ingaendeBalans = lopandeSaldo;
        }
      });

      konto.utgaendeBalans = lopandeSaldo;
    });

    return Array.from(kontoMap.values());
  }, [data]);

  // Year options - endast 2025
  const yearOptions = [{ value: "2025", label: "2025" }];

  // Month options - using shared PERIOD_OPTIONS
  const monthOptions = PERIOD_OPTIONS;

  // Filtrera konton efter månad - useMemo för att re-beräkna när selectedMonth ändras
  const filtradeKonton = useMemo(() => {
    if (selectedMonth === "all") {
      return huvudboksdata;
    }

    return huvudboksdata
      .map((konto) => ({
        ...konto,
        transaktioner: konto.transaktioner.filter((transaktion) => {
          const transaktionsDatum = new Date(transaktion.datum);
          const transaktionsMånad = (transaktionsDatum.getMonth() + 1).toString().padStart(2, "0");
          return transaktionsMånad === selectedMonth;
        }),
      }))
      .filter((konto) => konto.transaktioner.length > 0);
  }, [huvudboksdata, selectedMonth]);

  // Kategorisera konton enligt BAS-kontoplan - useMemo för att re-beräkna när filtradeKonton ändras
  const kategoriseradeKonton = useMemo(() => {
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

    filtradeKonton.forEach((konto) => {
      const kategori = kategorier.find((k) => k.pattern.test(konto.kontonummer));
      if (kategori) {
        kategori.konton.push(konto);
      }
    });

    return kategorier.filter((k) => k.konton.length > 0);
  }, [filtradeKonton]);

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
      exportHuvudbokCSV(filtradeKonton, foretagsprofil.företagsnamn, selectedMonth, selectedYear);
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
        foretagsprofil.företagsnamn,
        foretagsprofil.organisationsnummer,
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

  return {
    // State
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
    setSelectedMonth,
    setToast,
    handleShowVerifikat,
    handleCloseVerifikatModal,
    handleExportCSV,
    handleExportPDF,

    // Utils
    formatSEKLocal: formatCurrency,
  };
}
