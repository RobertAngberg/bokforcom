import Huvudinfo from "./Huvudinfo";
import Lonetabell from "./Lonetabell";
import Sammanfattning from "./Sammanfattning";
import SemesterInfo from "./SemesterInfo";
import SkatteInfo from "./SkatteInfo";
import Arssammanstollning from "./Arssammanstollning";
import ArbetstidInfo from "./ArbetstidInfo";
import Fotinfo from "./Fotinfo";
import { useForhandsgranskning } from "../../../../hooks/useForhandsgranskning";
import type { ForhandsgranskningProps } from "../../../../types/types";

export default function Forhandsgranskning({
  lönespec,
  anställd,
  företagsprofil,
  extrarader,
  beräknadeVärden = {},
  semesterSummary,
  onStäng,
}: ForhandsgranskningProps) {
  const {
    isExporting,
    företag,
    formatNoDecimals,
    extraraderMapped,
    bruttolön,
    skatt,
    socialaAvgifter,
    nettolön,
    utbetalningsDatum,
    periodStart,
    periodSlut,
    månadsNamn,
    handleExportPDF,
  } = useForhandsgranskning(lönespec, anställd, företagsprofil, extrarader, beräknadeVärden);

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
                semesterSummary={semesterSummary}
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
          {företag && <Fotinfo företag={företag} />}
        </div>
      </div>
    </div>
  );
}
