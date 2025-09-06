"use client";

import { useState, useEffect } from "react";

interface Lönekörning {
  id: number;
  period: string;
  status: string;
  startad_datum: Date;
  antal_anstallda?: number;
  total_bruttolön?: number;
}

interface LonekorningListaProps {
  onValjLonekorning: (lonekorning: Lönekörning) => void;
  valdLonekorning?: Lönekörning | null;
}

export default function LonekorningLista({
  onValjLonekorning,
  valdLonekorning,
}: LonekorningListaProps) {
  const [lonekorningar, setLonekorningar] = useState<Lönekörning[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLonekorningar();
  }, []);

  const loadLonekorningar = async () => {
    try {
      setLoading(true);
      // TODO: Hämta lönekörningar från API
      console.log("Hämtar lönekörningar...");

      // Simulera API-data
      const mockData: Lönekörning[] = [
        {
          id: 1,
          period: "2025-09",
          status: "pågående",
          startad_datum: new Date(),
          antal_anstallda: 3,
          total_bruttolön: 125000,
        },
      ];

      setLonekorningar(mockData);

      // Auto-välj första om ingen är vald
      if (!valdLonekorning && mockData.length > 0) {
        onValjLonekorning(mockData[0]);
      }
    } catch (error) {
      console.error("❌ Fel vid laddning av lönekörningar:", error);
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
              <span className="text-xl">🔄</span>
              <div>
                <h4 className="font-semibold text-white">Period {lonekorning.period}</h4>
                <p className="text-sm text-gray-400">
                  Startad {lonekorning.startad_datum.toLocaleDateString("sv-SE")}
                </p>
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
