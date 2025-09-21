import type { ToppInfoProps } from "../../../types/types";

export default function ToppInfo({
  månadsNamn,
  lönespec,
  anställd,
  getLönespecStatusBadge,
}: ToppInfoProps) {
  return (
    <div className="bg-slate-700 p-4 rounded-lg">
      <div className="flex justify-between items-start mb-4">
        <h4 className="text-lg font-bold text-white">Lönespecifikation {månadsNamn}</h4>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-base">
        <div>
          <span className="font-semibold text-white">Löneperiod:</span>
          <br />
          <span className="text-gray-300">
            {new Date(lönespec.period_start || lönespec.skapad).toLocaleDateString("sv-SE")} -{" "}
            {new Date(lönespec.period_slut || lönespec.skapad).toLocaleDateString("sv-SE")}
          </span>
        </div>
        <div>
          <span className="font-semibold text-white">Bankkonto:</span>
          <br />
          <span className="text-gray-300">
            {anställd.clearingnummer}-{anställd.bankkonto}
          </span>
        </div>
        <div>
          <span className="font-semibold text-white">Lönespec ID:</span>
          <br />
          <span className="text-gray-300">#{lönespec.id}</span>
        </div>
      </div>
    </div>
  );
}
