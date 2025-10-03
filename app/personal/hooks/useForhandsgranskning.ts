import { useState, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { hämtaFöretagsprofil } from "../actions/anstalldaActions";
import { beräknaSumma } from "../utils/extraraderUtils";
import { showToast } from "../../_components/Toast";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const useForhandsgranskning = (
  lönespec: any,
  anställd: any,
  företagsprofil: any,
  extrarader: any[] = [],
  beräknadeVärden: any = {}
) => {
  const [isExporting, setIsExporting] = useState(false);
  const [företag, setFöretag] = useState<any>(företagsprofil);

  // Formatter utan decimaler
  const formatNoDecimals = (num: number) =>
    Number(num).toLocaleString("sv-SE", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  // Mappa extrarader till rätt format
  const extraraderMapped = (extrarader ?? []).map((rad) => {
    const benämning = rad.benämning ?? rad.kolumn1 ?? "";
    const antal = rad.antal ?? rad.kolumn2 ?? "";
    let kostnad = parseFloat(
      (rad.kostnad ?? rad.belopp ?? rad.kolumn3 ?? "0").toString().replace(",", ".")
    );
    let summa = parseFloat(
      (rad.summa ?? rad.belopp ?? rad.kolumn3 ?? "0").toString().replace(",", ".")
    );

    // Om kostnad eller summa är 0, beräkna automatiskt med modalFields
    if (!kostnad || kostnad === 0) {
      kostnad = parseFloat(
        beräknaSumma(
          rad.typ,
          { ...rad, kolumn2: rad.antal ?? rad.kolumn2, kolumn3: rad.belopp ?? rad.kolumn3 },
          beräknadeVärden?.grundlön || lönespec?.grundlön || 0
        )
      );
    }
    if (!summa || summa === 0) {
      summa = parseFloat(
        beräknaSumma(
          rad.typ,
          { ...rad, kolumn2: rad.antal ?? rad.kolumn2, kolumn3: rad.belopp ?? rad.kolumn3 },
          beräknadeVärden?.grundlön || lönespec?.grundlön || 0
        )
      );
    }

    // Specialfall: Företagsbil (man anger bara summa)
    if (rad.typ === "foretagsbilExtra") {
      if (!kostnad || kostnad === 0) {
        kostnad = parseFloat(
          beräknaSumma(
            rad.typ,
            { kolumn3: rad.kolumn3 ?? rad.belopp ?? "0" },
            beräknadeVärden?.grundlön || lönespec?.grundlön || 0
          )
        );
      }
      if (!summa || summa === 0) {
        summa = parseFloat(
          beräknaSumma(
            rad.typ,
            { kolumn3: rad.kolumn3 ?? rad.belopp ?? "0" },
            beräknadeVärden?.grundlön || lönespec?.grundlön || 0
          )
        );
      }
    } else if (rad.typ === "vab") {
      // Specialfall: VAB (antal dagar krävs)
      if (!kostnad || kostnad === 0) {
        kostnad = parseFloat(
          beräknaSumma(
            rad.typ,
            { kolumn2: rad.antal ?? rad.kolumn2 },
            beräknadeVärden?.grundlön || lönespec?.grundlön || 0
          )
        );
      }
      if (!summa || summa === 0) {
        summa = parseFloat(
          beräknaSumma(
            rad.typ,
            { kolumn2: rad.antal ?? rad.kolumn2 },
            beräknadeVärden?.grundlön || lönespec?.grundlön || 0
          )
        );
      }
    } else {
      // Default: skicka in både antal och belopp
      if (!kostnad || kostnad === 0) {
        kostnad = parseFloat(
          beräknaSumma(
            rad.typ as string,
            { ...rad, kolumn2: rad.antal ?? rad.kolumn2, kolumn3: rad.belopp ?? rad.kolumn3 },
            (beräknadeVärden?.grundlön as number) || (lönespec?.grundlön as number) || 0
          )
        );
      }
      if (!summa || summa === 0) {
        summa = parseFloat(
          beräknaSumma(
            rad.typ as string,
            { ...rad, kolumn2: rad.antal ?? rad.kolumn2, kolumn3: rad.belopp ?? rad.kolumn3 },
            (beräknadeVärden?.grundlön as number) || (lönespec?.grundlön as number) || 0
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

  useEffect(() => {
    async function hämtaFöretag() {
      try {
        if (!företag && anställd?.user_id) {
          const företagsdata = await hämtaFöretagsprofil(anställd.user_id as string);
          setFöretag(företagsdata);
        }
      } catch (error) {
        console.error("❌ Fel vid hämtning av företagsinfo:", error);
      }
    }
    hämtaFöretag();
  }, [företag, anställd]);

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
    företag,
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
