import { useState, useEffect } from "react";
import { exportResultatrapportPDF, exportResultatrapportCSV } from "../../_utils/fileUtils";
import { hamtaResultatrapport, fetchForetagsprofil } from "../actions/resultatrapportActions";
import { ResultatKonto, KontoRad, ResultatData, Verifikation } from "../types/types";

export const useResultatrapport = () => {
  // Filter state
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  // Grundläggande state
  const [initialData, setInitialData] = useState<ResultatData | null>(null);
  const [företagsnamn, setFöretagsnamn] = useState<string>("");
  const [organisationsnummer, setOrganisationsnummer] = useState<string>("");
  const [loading, setLoading] = useState(true);

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
  const [exportMessage, setExportMessage] = useState<string>("");

  // Data fetching effect
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [resultData, profilData] = await Promise.all([
          hamtaResultatrapport(), // TODO: Uppdatera för att ta selectedYear som parameter
          fetchForetagsprofil(),
        ]);

        // Typ-konvertering från actions till ResultatData
        const convertedData: ResultatData = {
          ar: resultData.ar,
          intakter: resultData.intakter.map((grupp) => ({
            namn: grupp.namn,
            konton: grupp.konton.map((konto) => konto as ResultatKonto),
            summering: grupp.summering,
          })),
          rorelsensKostnader: resultData.rorelsensKostnader.map((grupp) => ({
            namn: grupp.namn,
            konton: grupp.konton.map((konto) => konto as ResultatKonto),
            summering: grupp.summering,
          })),
          finansiellaIntakter: resultData.finansiellaIntakter?.map((grupp) => ({
            namn: grupp.namn,
            konton: grupp.konton.map((konto) => konto as ResultatKonto),
            summering: grupp.summering,
          })),
          finansiellaKostnader: resultData.finansiellaKostnader.map((grupp) => ({
            namn: grupp.namn,
            konton: grupp.konton.map((konto) => konto as ResultatKonto),
            summering: grupp.summering,
          })),
        };

        setInitialData(convertedData);
        setFöretagsnamn(profilData?.företagsnamn ?? "");
        setOrganisationsnummer(profilData?.organisationsnummer ?? "");
      } catch (error) {
        console.error("Fel vid laddning av resultatdata:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedYear]); // Lägg till selectedYear som dependency

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

  const years = [...data.ar].sort((a, b) => parseInt(b) - parseInt(a));
  const currentYear = years[0] || new Date().getFullYear().toString();
  const previousYear = years[1] || (parseInt(currentYear) - 1).toString();

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

  // Helper functions
  const formatSEKforPDF = (val: number) => {
    if (val === 0) return "0";
    const isNegative = val < 0;
    const absVal = Math.abs(val);
    const formatted = Math.round(absVal).toLocaleString("sv-SE");
    return isNegative ? `-${formatted}` : formatted;
  };

  // Export functions
  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    setExportMessage("");

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

      setExportMessage("PDF-rapporten har laddats ner");
      setTimeout(() => setExportMessage(""), 3000);
    } catch (error) {
      console.error("PDF export error:", error);
      setExportMessage("Fel vid PDF export");
      setTimeout(() => setExportMessage(""), 5000);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportCSV = async () => {
    setIsExportingCSV(true);
    setExportMessage("");

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

      setExportMessage("CSV-filen har laddats ner");
      setTimeout(() => setExportMessage(""), 3000);
    } catch (error) {
      console.error("CSV export error:", error);
      setExportMessage("Fel vid CSV export");
      setTimeout(() => setExportMessage(""), 5000);
    } finally {
      setIsExportingCSV(false);
    }
  };

  return {
    // Filter state
    selectedYear,
    setSelectedYear,
    // Data state
    initialData,
    setInitialData,
    företagsnamn,
    setFöretagsnamn,
    organisationsnummer,
    setOrganisationsnummer,
    loading,
    setLoading,
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
    setIsExportingPDF,
    isExportingCSV,
    setIsExportingCSV,
    exportMessage,
    setExportMessage,
    // Modal functions
    handleShowVerifikationer,
    // Data processing
    data,
    years,
    currentYear,
    previousYear,
    summering,
    intaktsSum,
    rorelsensSum,
    finansiellaIntakterSum,
    finansiellaKostnaderSum,
    // Helper functions
    formatSEKforPDF,
    // Export functions
    handleExportPDF,
    handleExportCSV,
  };
};

export type { ResultatData, KontoRad, ResultatKonto };
