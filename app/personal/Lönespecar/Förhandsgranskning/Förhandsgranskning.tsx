import { useState, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { hämtaFöretagsprofil } from "../../actions";
import Huvudinfo from "../Förhandsgranskning/Huvudinfo";
import Lönetabell from "../Förhandsgranskning/Lönetabell";
import Sammanfattning from "../Förhandsgranskning/Sammanfattning";
import SemesterInfo from "../Förhandsgranskning/SemesterInfo";
import SkatteInfo from "../Förhandsgranskning/SkatteInfo";
import Årssammanställning from "../Förhandsgranskning/Årssammanställning";
import ArbetstidInfo from "../Förhandsgranskning/ArbetstidInfo";
import Fotinfo from "../Förhandsgranskning/Fotinfo";

interface FörhandsgranskningProps {
  lönespec: any;
  anställd: any;
  företagsprofil: any;
  extrarader: any[];
  beräknadeVärden?: any;
  onStäng: () => void;
}

export default function Förhandsgranskning({
  lönespec,
  anställd,
  företagsprofil,
  extrarader,
  beräknadeVärden = {},
  onStäng,
}: FörhandsgranskningProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [företag, setFöretag] = useState<any>(företagsprofil);

  // Formatter utan decimaler
  const formatNoDecimals = (num: number) =>
    Number(num).toLocaleString("sv-SE", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  // Mappa extrarader till rätt format
  const extraraderMapped = (extrarader ?? []).map((rad: any) => ({
    benämning: rad.benämning ?? rad.kolumn1 ?? "",
    antal: rad.antal ?? rad.kolumn2 ?? "",
    kostnad: parseFloat(
      (rad.kostnad ?? rad.belopp ?? rad.kolumn3 ?? "0").toString().replace(",", ".")
    ),
    summa: parseFloat((rad.summa ?? rad.belopp ?? rad.kolumn3 ?? "0").toString().replace(",", ".")),
  }));

  // Använd beräknade värden om de finns, annars fall back till lönespec
  const bruttolön = beräknadeVärden.bruttolön ?? parseFloat(lönespec?.bruttolön || 0);
  const skatt = beräknadeVärden.skatt ?? parseFloat(lönespec?.skatt || 0);
  const socialaAvgifter =
    beräknadeVärden.socialaAvgifter ?? parseFloat(lönespec?.sociala_avgifter || 0);
  const totalLönekostnad = beräknadeVärden.lönekostnad ?? bruttolön + socialaAvgifter;
  const nettolön = beräknadeVärden.nettolön ?? parseFloat(lönespec?.nettolön || 0);

  const utbetalningsDatum = new Date(lönespec?.år || 2025, (lönespec?.månad || 1) - 1, 25);
  const periodStart = new Date(lönespec?.period_start || lönespec?.skapad);
  const periodSlut = new Date(lönespec?.period_slut || lönespec?.skapad);

  const månadsNamn = new Date(
    lönespec?.år || 2025,
    (lönespec?.månad || 1) - 1,
    1
  ).toLocaleDateString("sv-SE", { month: "long", year: "numeric" });

  useEffect(() => {
    async function hämtaFöretag() {
      try {
        if (!företag && anställd?.user_id) {
          const företagsdata = await hämtaFöretagsprofil(anställd.user_id);
          setFöretag(företagsdata);
        }
      } catch (error) {
        console.error("❌ Fel vid hämtning av företagsinfo:", error);
      }
    }
    hämtaFöretag();
  }, [företag, anställd?.user_id]);

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
        alert(`❌ Kunde inte exportera PDF: ${error.message}`);
      } else {
        alert("❌ Kunde inte exportera PDF: Okänt fel");
      }
    } finally {
      setIsExporting(false);
    }
  };

  if (!lönespec || !anställd) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
        {/* Modal med knappar */}
        <div className="sticky top-0 bg-slate-800 text-white p-4 flex justify-end items-center z-10">
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded transition-colors"
          >
            {isExporting ? "Exporterar..." : "📤 Exportera PDF"}
          </button>
          <button
            onClick={onStäng}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors ml-2"
          >
            ✕ Stäng
          </button>
        </div>

        {/* PDF-innehåll */}
        <div
          id="lonespec-print-area"
          className="bg-white text-black w-full max-w-[210mm] mx-auto p-8 text-xs leading-tight min-h-[297mm] flex flex-col"
          style={{ backgroundColor: "#ffffff", color: "#000000" }}
        >
          <Huvudinfo
            anställd={anställd}
            månadsNamn={månadsNamn}
            periodStart={periodStart}
            periodSlut={periodSlut}
          />
          <Lönetabell
            lönespec={lönespec}
            bruttolön={bruttolön}
            extraraderMapped={extraraderMapped}
            formatNoDecimals={formatNoDecimals}
          />
          <div className="grid grid-cols-2 gap-6 mb-6">
            <Sammanfattning
              totalLönekostnad={totalLönekostnad}
              bruttolön={bruttolön}
              socialaAvgifter={socialaAvgifter}
              skatt={skatt}
              extraraderMapped={extraraderMapped}
              formatNoDecimals={formatNoDecimals}
              utbetalningsDatum={utbetalningsDatum}
              nettolön={nettolön}
            />
            <div className="space-y-3">
              <SemesterInfo
                lönespec={lönespec}
                anställd={anställd}
                formatNoDecimals={formatNoDecimals}
              />
              <SkatteInfo anställd={anställd} />
            </div>
          </div>
          <Årssammanställning
            bruttolön={bruttolön}
            skatt={skatt}
            formatNoDecimals={formatNoDecimals}
          />
          <ArbetstidInfo lönespec={lönespec} formatNoDecimals={formatNoDecimals} />
          <Fotinfo företag={företag} />
        </div>
      </div>
    </div>
  );
}
