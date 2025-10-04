import { useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { beräknaSumma } from "../utils/extraraderUtils";
import { showToast } from "../../_components/Toast";
import type {
  Lönespec,
  AnställdListItem,
  Företagsprofil,
  ExtraradData,
  BeräknadeVärden,
} from "../types/types";

interface MappedExtrarad {
  benämning: string;
  antal: string;
  kostnad: number;
  summa: number;
}

export const useForhandsgranskning = (
  lönespec: Lönespec | null,
  anställd: AnställdListItem | null,
  företagsprofil: Företagsprofil | null,
  extrarader: ExtraradData[] = [],
  beräknadeVärden: BeräknadeVärden = {}
) => {
  const [isExporting, setIsExporting] = useState(false);

  // Helper för att konvertera till nummer
  const toNum = (val: unknown): number => {
    if (typeof val === "number") return val;
    if (typeof val === "string") return parseFloat(val) || 0;
    return 0;
  };

  // Formatter utan decimaler
  const formatNoDecimals = (num: number) =>
    Number(num).toLocaleString("sv-SE", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  // Mappa extrarader till rätt format
  const extraraderMapped: MappedExtrarad[] = (extrarader ?? []).map((rad) => {
    const benämning = rad.kolumn1 ?? "";
    const antal = rad.kolumn2 ?? "";
    let kostnad = parseFloat((rad.kolumn3 ?? "0").toString().replace(",", "."));
    let summa = parseFloat((rad.kolumn3 ?? "0").toString().replace(",", "."));

    const grundlön = toNum(beräknadeVärden?.grundlön) || toNum(lönespec?.grundlön) || 0;

    // Om kostnad eller summa är 0, beräkna automatiskt med modalFields
    if (!kostnad || kostnad === 0) {
      kostnad = parseFloat(
        beräknaSumma(rad.typ, { ...rad, kolumn2: rad.kolumn2, kolumn3: rad.kolumn3 }, grundlön)
      );
    }
    if (!summa || summa === 0) {
      summa = parseFloat(
        beräknaSumma(rad.typ, { ...rad, kolumn2: rad.kolumn2, kolumn3: rad.kolumn3 }, grundlön)
      );
    }

    // Specialfall: Företagsbil (man anger bara summa)
    if (rad.typ === "foretagsbilExtra") {
      if (!kostnad || kostnad === 0) {
        kostnad = parseFloat(beräknaSumma(rad.typ, { kolumn3: rad.kolumn3 ?? "0" }, grundlön));
      }
      if (!summa || summa === 0) {
        summa = parseFloat(beräknaSumma(rad.typ, { kolumn3: rad.kolumn3 ?? "0" }, grundlön));
      }
    } else if (rad.typ === "vab") {
      // Specialfall: VAB (antal dagar krävs)
      if (!kostnad || kostnad === 0) {
        kostnad = parseFloat(beräknaSumma(rad.typ, { kolumn2: rad.kolumn2 }, grundlön));
      }
      if (!summa || summa === 0) {
        summa = parseFloat(beräknaSumma(rad.typ, { kolumn2: rad.kolumn2 }, grundlön));
      }
    } else {
      // Default: skicka in både antal och belopp
      if (!kostnad || kostnad === 0) {
        kostnad = parseFloat(
          beräknaSumma(
            rad.typ as string,
            { ...rad, kolumn2: rad.kolumn2, kolumn3: rad.kolumn3 },
            grundlön
          )
        );
      }
      if (!summa || summa === 0) {
        summa = parseFloat(
          beräknaSumma(
            rad.typ as string,
            { ...rad, kolumn2: rad.kolumn2, kolumn3: rad.kolumn3 },
            grundlön
          )
        );
      }
    }
    return { benämning, antal, kostnad, summa };
  });

  // Använd beräknade värden om de finns, annars fall back till lönespec
  const bruttolön =
    (beräknadeVärden.bruttolön as number) ?? parseFloat((lönespec?.bruttolön as string) || "0");
  const skatt = (beräknadeVärden.skatt as number) ?? parseFloat((lönespec?.skatt as string) || "0");
  const socialaAvgifter =
    (beräknadeVärden.socialaAvgifter as number) ??
    parseFloat((lönespec?.sociala_avgifter as string) || "0");
  const totalLönekostnad = (beräknadeVärden.lönekostnad as number) ?? bruttolön + socialaAvgifter;
  const nettolön =
    (beräknadeVärden.nettolön as number) ?? parseFloat((lönespec?.nettolön as string) || "0");

  const utbetalningsDatum = new Date(
    (lönespec?.år as number) || 2025,
    ((lönespec?.månad as number) || 1) - 1,
    25
  );
  const periodStart = new Date((lönespec?.period_start as string) || (lönespec?.skapad as string));
  const periodSlut = new Date((lönespec?.period_slut as string) || (lönespec?.skapad as string));

  const månadsNamn = new Date(
    (lönespec?.år as number) || 2025,
    ((lönespec?.månad as number) || 1) - 1,
    1
  ).toLocaleDateString("sv-SE", { month: "long", year: "numeric" });

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const element = document.getElementById("lonespec-print-area");
      if (!element) throw new Error("Element not found");

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: true,
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
      pdf.save(
        `lonespec-${anställd?.förnamn}-${anställd?.efternamn}-${månadsNamn.replace(" ", "-")}.pdf`
      );
    } catch (error) {
      console.error("❌ Error exporting PDF:", error);
      if (error instanceof Error) {
        showToast(`Kunde inte exportera PDF: ${error.message}`, "error");
      } else {
        showToast("Kunde inte exportera PDF: Okänt fel", "error");
      }
    } finally {
      setIsExporting(false);
    }
  };

  return {
    // State
    isExporting,
    företag: företagsprofil,
    // Computed values
    formatNoDecimals,
    extraraderMapped,
    bruttolön,
    skatt,
    socialaAvgifter,
    totalLönekostnad,
    nettolön,
    utbetalningsDatum,
    periodStart,
    periodSlut,
    månadsNamn,
    // Functions
    handleExportPDF,
  };
};
