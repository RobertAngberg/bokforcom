import { useState, useMemo } from "react";
import { exportResultatrapportPDF, exportResultatrapportCSV } from "../../_utils/fileUtils";
import type { KontoRad, Verifikation, ToastState, UseResultatrapportProps } from "../types/types";
import { formatSEK } from "../../_utils/format";
import { processResultatData } from "../utils/resultatProcessing";

export const useResultatrapport = ({
  transaktionsdata,
  foretagsprofil,
}: UseResultatrapportProps) => {
  // Filter state - default till 2025
  const selectedYear = "2025";
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  // Företagsinformation
  const företagsnamn = foretagsprofil.företagsnamn;
  const organisationsnummer = foretagsprofil.organisationsnummer;
  const loading = false; // Ingen loading eftersom data redan finns

  // Modal state
  const [verifikatId, setVerifikatId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedKonto, setSelectedKonto] = useState("");
  const [verifikationer, setVerifikationer] = useState<Verifikation[]>([]);
  const [loadingModal, setLoadingModal] = useState(false);
  const [verifikatMeta, setVerifikatMeta] = useState<{
    leverantor?: string;
    fakturanummer?: string;
  } | null>(null);

  // Export state
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  // Process resultatdata med useMemo - rent derived state
  const initialData = useMemo(() => {
    try {
      const resultData = processResultatData(transaktionsdata, selectedYear, selectedMonth);
      console.log(`Resultatdata processad för ${selectedYear} (${selectedMonth})`);
      return resultData;
    } catch (error) {
      console.error("Fel vid processning av resultatdata:", error);
      return null;
    }
  }, [transaktionsdata, selectedYear, selectedMonth]);

  // Modal functions
  const handleShowVerifikationer = async (kontonummer: string) => {
    setSelectedKonto(kontonummer);
    setShowModal(true);
    setLoadingModal(true);

    try {
      // Hämta riktiga verifikationer från databasen
      const response = await fetch(`/api/verifikationer?konto=${kontonummer}`);
      if (response.ok) {
        const data = await response.json();
        setVerifikationer(data);
      } else {
        setVerifikationer([]);
      }
    } catch (error) {
      console.error("Fel vid hämtning av verifikationer:", error);
      setVerifikationer([]);
    } finally {
      setLoadingModal(false);
    }
  };

  // Data processing functions
  const summering = (rader: KontoRad[] = []) => {
    const years = [...(initialData?.ar || [])].sort((a, b) => parseInt(b) - parseInt(a));
    return years.reduce(
      (acc, year) => {
        const sum = rader.reduce((radSum, rad) => {
          const value = typeof rad.summering?.[year] === "number" ? rad.summering[year] : 0;
          return radSum + value;
        }, 0);
        acc[year] = sum;
        return acc;
      },
      {} as Record<string, number>
    );
  };

  // Beräknade värden baserat på data
  const data = initialData || {
    ar: [],
    intakter: [],
    rorelsensKostnader: [],
    finansiellaIntakter: [],
    finansiellaKostnader: [],
  };

  // Endast 2025
  const years = ["2025"];
  const currentYear = "2025";

  const intaktsSumRaw = summering(data.intakter);
  const intaktsSum = Object.keys(intaktsSumRaw).reduce(
    (acc, year) => {
      acc[year] = -intaktsSumRaw[year]; // Negativ för att visa rätt tecken
      return acc;
    },
    {} as Record<string, number>
  );

  const rorelsensSum = summering(data.rorelsensKostnader);
  const finansiellaIntakterSum = summering(data.finansiellaIntakter);
  const finansiellaKostnaderSum = summering(data.finansiellaKostnader);

  // Export functions
  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    setToast(null);

    try {
      // Transform data to format expected by fileUtils
      const transformGroup = (grupp: KontoRad) => ({
        namn: grupp.namn,
        konton: grupp.konton.map((konto) => ({
          kontonummer: konto.kontonummer,
          beskrivning: konto.beskrivning,
          belopp: (konto[currentYear] as number) || 0,
        })),
        summa: grupp.summering?.[currentYear] || 0,
      });

      const intakterTransformed = data.intakter.map(transformGroup);
      const kostnaderTransformed = data.rorelsensKostnader.map(transformGroup);
      const finansiellaIntakterTransformed = data.finansiellaIntakter?.map(transformGroup) || [];
      const finansiellaKostnaderTransformed = data.finansiellaKostnader.map(transformGroup);

      // Calculate net result for current year
      const nettoResultat =
        (intaktsSum[currentYear] || 0) +
        (rorelsensSum[currentYear] || 0) +
        (finansiellaIntakterSum[currentYear] || 0) +
        (finansiellaKostnaderSum[currentYear] || 0);

      await exportResultatrapportPDF(
        intakterTransformed,
        kostnaderTransformed,
        finansiellaIntakterTransformed,
        finansiellaKostnaderTransformed,
        nettoResultat,
        företagsnamn,
        organisationsnummer,
        "all", // selectedMonth (resultatrapport shows full year)
        currentYear
      );

      setToast({ type: "success", message: "PDF-rapporten har laddats ner" });
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error("PDF export error:", error);
      setToast({ type: "error", message: "Fel vid PDF export" });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportCSV = async () => {
    setIsExportingCSV(true);
    setToast(null);

    try {
      // Transform data to format expected by fileUtils
      const transformGroup = (grupp: KontoRad) => ({
        namn: grupp.namn,
        konton: grupp.konton.map((konto) => ({
          kontonummer: konto.kontonummer,
          beskrivning: konto.beskrivning,
          belopp: (konto[currentYear] as number) || 0,
        })),
        summa: grupp.summering?.[currentYear] || 0,
      });

      const intakterTransformed = data.intakter.map(transformGroup);
      const kostnaderTransformed = data.rorelsensKostnader.map(transformGroup);
      const finansiellaIntakterTransformed = data.finansiellaIntakter?.map(transformGroup) || [];
      const finansiellaKostnaderTransformed = data.finansiellaKostnader.map(transformGroup);

      // Calculate net result for current year
      const nettoResultat =
        (intaktsSum[currentYear] || 0) +
        (rorelsensSum[currentYear] || 0) +
        (finansiellaIntakterSum[currentYear] || 0) +
        (finansiellaKostnaderSum[currentYear] || 0);

      exportResultatrapportCSV(
        intakterTransformed,
        kostnaderTransformed,
        finansiellaIntakterTransformed,
        finansiellaKostnaderTransformed,
        nettoResultat,
        företagsnamn,
        organisationsnummer,
        "all", // selectedMonth (resultatrapport shows full year)
        currentYear
      );

      setToast({ type: "success", message: "CSV-filen har laddats ner" });
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error("CSV export error:", error);
      setToast({ type: "error", message: "Fel vid CSV export" });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setIsExportingCSV(false);
    }
  };

  return {
    // Filter state
    selectedYear,
    selectedMonth,
    setSelectedMonth,
    // Data state
    initialData,
    företagsnamn,
    organisationsnummer,
    loading,
    // Modal state
    verifikatId,
    setVerifikatId,
    showModal,
    setShowModal,
    selectedKonto,
    setSelectedKonto,
    verifikationer,
    setVerifikationer,
    loadingModal,
    setLoadingModal,
    verifikatMeta,
    setVerifikatMeta,
    // Export state
    isExportingPDF,
    isExportingCSV,
    toast,
    setToast,
    // Modal functions
    handleShowVerifikationer,
    // Data processing
    data,
    years,
    currentYear,
    summering,
    intaktsSum,
    rorelsensSum,
    finansiellaIntakterSum,
    finansiellaKostnaderSum,
    // Helper functions
    formatSEK,
    // Export functions
    handleExportPDF,
    handleExportCSV,
  };
};
