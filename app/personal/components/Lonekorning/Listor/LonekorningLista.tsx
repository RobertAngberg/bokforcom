"use client";

import { LonekorningListaProps } from "../../../types/types";
import LoadingSpinner from "../../../../_components/LoadingSpinner";

export default function LonekorningLista({
  onValjLonekorning,
  valdLonekorning,
  // refreshTrigger,
  lonekorningar = [],
  hasLonekorningar = false,
  listLoading = false,
  formatPeriodName = (period: string) => period,
  getItemClassName = (_lonekorning, _valdLonekorningItem) =>
    "p-4 border rounded-lg cursor-pointer hover:bg-gray-50",
}: LonekorningListaProps) {
  // Now using data from props instead of duplicate useLonekorning hook
  console.log("🏗️ LonekorningLista render - props:", {
    lonekorningar: lonekorningar?.length || 0,
    hasLonekorningar,
    listLoading,
  });

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
          className={getItemClassName(lonekorning, valdLonekorning || undefined)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">💰</span>
              <div>
                <h4 className="font-semibold text-white">{formatPeriodName(lonekorning.period)}</h4>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-flex items-center px-2 py-1 rounded text-xs font-medium text-white bg-cyan-600">
                {lonekorning.status.toUpperCase()}
              </div>

              {lonekorning.antal_anstallda && (
                <p className="text-xs text-gray-400 mt-1">
                  {lonekorning.antal_anstallda} anställda
                </p>
              )}

              {lonekorning.total_bruttolön && (
                <p className="text-xs text-gray-300 font-medium">
                  {lonekorning.total_bruttolön.toLocaleString("sv-SE")} kr
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
