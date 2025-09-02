import { useState, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { hämtaFöretagsprofil } from "../../../actions";
import Toast from "../../../../_components/Toast";
import Huvudinfo from "./Huvudinfo";
import Lonetabell from "./Lonetabell";
import Sammanfattning from "./Sammanfattning";
import SemesterInfo from "./SemesterInfo";
import SkatteInfo from "./SkatteInfo";
import { beräknaSumma } from "../../Extrarader/extraraderUtils";
import Arssammanstollning from "./Arssammanstollning";
import ArbetstidInfo from "./ArbetstidInfo";
import Fotinfo from "./Fotinfo";

interface ForhandsgranskningProps {
  lönespec: any;
  anställd: any;
  företagsprofil: any;
  extrarader: any[];
  beräknadeVärden?: any;
  onStäng: () => void;
}

export default function Forhandsgranskning({
  lönespec,
  anställd,
  företagsprofil,
  extrarader,
  beräknadeVärden = {},
  onStäng,
}: ForhandsgranskningProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [företag, setFöretag] = useState<any>(företagsprofil);
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // Formatter utan decimaler
  const formatNoDecimals = (num: number) =>
    Number(num).toLocaleString("sv-SE", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  // Mappa extrarader till rätt format

  const extraraderMapped = (extrarader ?? []).map((rad: any) => {
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
    }
    return { benämning, antal, kostnad, summa };
  });

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
        setToast({ type: "error", message: `Kunde inte exportera PDF: ${error.message}` });
      } else {
        setToast({ type: "error", message: "Kunde inte exportera PDF: Okänt fel" });
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
          <Lonetabell
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
          <Arssammanstollning
            bruttolön={bruttolön}
            skatt={skatt}
            formatNoDecimals={formatNoDecimals}
          />
          <ArbetstidInfo lönespec={lönespec} formatNoDecimals={formatNoDecimals} />
          <Fotinfo företag={företag} />
        </div>
      </div>
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          isVisible={true}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
