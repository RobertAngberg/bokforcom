import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { formatSEK } from "../../_utils/format";
import { hamtaResultatrapport, fetchFöretagsprofil } from "../actions/resultatrapportActions";
import { ResultatKonto, KontoRad, ResultatData, Verifikation } from "../types/types";

export const useResultatrapport = () => {
  // Filter state
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

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
          fetchFöretagsprofil(),
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
      const element = document.getElementById("resultatrapport-print-area");
      if (!element) {
        throw new Error("Kunde inte hitta rapporten för export");
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        allowTaint: true,
        foreignObjectRendering: false,
        imageTimeout: 15000,
        removeContainer: false,
      });

      const imageData = canvas.toDataURL("image/png");
      if (
        imageData ===
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
      ) {
        throw new Error("Canvas är tom!");
      }

      const pdf = new jsPDF("portrait", "mm", "a4");
      const pdfWidth = 210;
      const imgWidth = pdfWidth - 15;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imageData, "PNG", 7.5, 5, imgWidth, imgHeight);
      pdf.save(`resultatrapport-${selectedYear}-${företagsnamn.replace(/\s+/g, "-")}.pdf`);

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
      // Skapa CSV data
      const csvRows = [];

      // Header
      csvRows.push(["Konto", "Benämning", previousYear, currentYear, "Förändring"]);

      // Intäkter
      if (data.intakter && data.intakter.length > 0) {
        csvRows.push(["", "RÖRELSENS INTÄKTER", "", "", ""]);
        data.intakter.forEach((grupp) => {
          csvRows.push(["", grupp.namn, "", "", ""]);
          grupp.konton.forEach((konto) => {
            const prevValue = (konto[previousYear] as number) || 0;
            const currValue = (konto[currentYear] as number) || 0;
            const change = currValue - prevValue;
            csvRows.push([
              konto.kontonummer,
              konto.beskrivning,
              formatSEK(-prevValue),
              formatSEK(-currValue),
              formatSEK(-change),
            ]);
          });
        });
        csvRows.push([
          "",
          `Summa rörelsens intäkter`,
          "",
          formatSEK(intaktsSum[currentYear] || 0),
          "",
        ]);
      }

      // Kostnader
      if (data.rorelsensKostnader && data.rorelsensKostnader.length > 0) {
        csvRows.push(["", "RÖRELSENS KOSTNADER", "", "", ""]);
        data.rorelsensKostnader.forEach((grupp) => {
          csvRows.push(["", grupp.namn, "", "", ""]);
          grupp.konton.forEach((konto) => {
            const prevValue = (konto[previousYear] as number) || 0;
            const currValue = (konto[currentYear] as number) || 0;
            const change = currValue - prevValue;
            csvRows.push([
              konto.kontonummer,
              konto.beskrivning,
              formatSEK(prevValue),
              formatSEK(currValue),
              formatSEK(change),
            ]);
          });
        });
        csvRows.push([
          "",
          `Summa rörelsens kostnader`,
          "",
          formatSEK(rorelsensSum[currentYear] || 0),
          "",
        ]);
      }

      // Konvertera till CSV-sträng
      const csvContent = csvRows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

      // Ladda ner filen
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `resultatrapport-${selectedYear}-${företagsnamn.replace(/\s+/g, "-")}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

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
    selectedMonth,
    setSelectedMonth,
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
