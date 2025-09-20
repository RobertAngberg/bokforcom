"use client";

import { useState, useEffect } from "react";
import { hämtaAllaLönekörningar } from "../../actions/lonekorningActions";
import { Lönekörning, LonekorningListaProps } from "../../../types/types";

export default function LonekorningLista({
  onValjLonekorning,
  valdLonekorning,
  refreshTrigger,
}: LonekorningListaProps) {
  const [lonekorningar, setLonekorningar] = useState<Lönekörning[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLonekorningar();
  }, [refreshTrigger]); // Lägg till refreshTrigger som dependency

  const loadLonekorningar = async () => {
    try {
      setLoading(true);
      const result = await hämtaAllaLönekörningar();

      if (result.success && result.data) {
        setLonekorningar(result.data);
      } else {
        console.error("❌ Fel vid laddning av lönekörningar:", result.error);
        setLonekorningar([]);
      }
    } catch (error) {
      console.error("❌ Fel vid laddning av lönekörningar:", error);
      setLonekorningar([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-white">Laddar lönekörningar...</div>;
  }

  if (lonekorningar.length === 0) {
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
          className={`
            p-4 rounded-lg border-2 cursor-pointer transition-all hover:border-cyan-500
            ${
              valdLonekorning?.id === lonekorning.id
                ? "border-cyan-500 bg-slate-700"
                : "border-slate-600 bg-slate-800 hover:bg-slate-700"
            }
          `}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">💰</span>
              <div>
                <h4 className="font-semibold text-white">
                  {(() => {
                    const [år, månad] = lonekorning.period.split("-");
                    const månadsNamn = [
                      "Januari",
                      "Februari",
                      "Mars",
                      "April",
                      "Maj",
                      "Juni",
                      "Juli",
                      "Augusti",
                      "September",
                      "Oktober",
                      "November",
                      "December",
                    ];
                    return `${månadsNamn[parseInt(månad) - 1]} ${år}`;
                  })()}
                </h4>
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
