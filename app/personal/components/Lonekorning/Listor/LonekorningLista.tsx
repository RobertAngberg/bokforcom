"use client";

import { LonekorningListaProps } from "../../../types/types";
import LoadingSpinner from "../../../../_components/LoadingSpinner";
import Knapp from "../../../../_components/Knapp";

export default function LonekorningLista({
  onValjLonekorning,
  valdLonekorning,
  // refreshTrigger,
  lonekorningar = [],
  hasLonekorningar = false,
  listLoading = false,
  formatPeriodName = (period: string) => period,
  onTaBortLonekorning,
  taBortLoading = false,
}: LonekorningListaProps) {
  // Now using data from props instead of duplicate useLonekorning hook

  if (listLoading) {
    return <LoadingSpinner />;
  }

  if (!hasLonekorningar) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 text-center">
        <div className="text-gray-400">
          <span className="text-4xl">📋</span>
          <p className="mt-2">Inga lönekörningar skapade än</p>
          <p className="text-sm text-gray-500">Skapa din första lönekörning för att komma igång</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-white mb-4">Välj lönekörning</h3>

      {lonekorningar.map((lonekorning) => (
        <div
          key={lonekorning.id}
          onClick={() => onValjLonekorning(lonekorning)}
          className={[
            "p-4 rounded-lg border-2 cursor-pointer transition-all",
            valdLonekorning?.id === lonekorning.id
              ? "border-cyan-500 bg-slate-700"
              : "border-slate-600 bg-slate-800 hover:border-cyan-500 hover:bg-slate-700",
          ].join(" ")}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex items-center gap-3 sm:flex-1">
              <span className="text-xl">💰</span>
              <div>
                <h4 className="font-semibold text-white">{formatPeriodName(lonekorning.period)}</h4>
                {lonekorning.antal_anstallda && (
                  <p className="text-xs text-gray-400 mt-1">
                    {lonekorning.antal_anstallda} anställda
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col items-start gap-2 text-left">
              <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white bg-cyan-600">
                {lonekorning.status.toUpperCase()}
              </div>

              {lonekorning.total_bruttolön && (
                <p className="text-[11px] text-gray-300 font-medium">
                  {lonekorning.total_bruttolön.toLocaleString("sv-SE")} kr
                </p>
              )}

              {onTaBortLonekorning && (
                <Knapp
                  text="🗑️ Ta bort"
                  onClick={(event) => {
                    event?.stopPropagation();
                    onTaBortLonekorning(lonekorning);
                  }}
                  disabled={taBortLoading}
                  loading={taBortLoading}
                  loadingText="Tar bort..."
                  className="px-3 py-1 text-sm"
                />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
