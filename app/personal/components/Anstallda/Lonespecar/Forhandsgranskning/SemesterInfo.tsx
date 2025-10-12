import type { SemesterInfoProps } from "../../../../types/types";

export default function SemesterInfo({ lönespec, anställd, semesterSummary }: SemesterInfoProps) {
  const betaldaDagar = semesterSummary?.betalda_dagar ?? lönespec?.semester_uttag ?? 0;
  const sparadeDagar = semesterSummary?.sparade_dagar ?? anställd?.sparade_dagar ?? 0;
  const förskottDagar = semesterSummary?.skuld ?? anställd?.använda_förskott ?? 0;

  return (
    <div className="border border-gray-400 rounded p-3">
      <h4 className="font-bold mb-2 text-black text-sm">Semesterdagar</h4>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="text-center">
          <div className="font-semibold text-black">Betalda</div>
          <div className="text-sm font-bold text-black">{betaldaDagar}</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-black">Sparade</div>
          <div className="text-sm font-bold text-black">{sparadeDagar}</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-black">Förskott</div>
          <div className="text-sm font-bold text-black">{förskottDagar}</div>
        </div>
      </div>
    </div>
  );
}
