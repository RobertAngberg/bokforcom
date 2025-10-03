import { useState, useEffect } from "react";
import { hämtaAllaLönekörningar } from "../actions/lonekorningActions";
import { Lönekörning } from "../types/types";

interface UseLonekorningListaProps {
  refreshTrigger?: number | string;
}

export function useLonekorningLista({ refreshTrigger }: UseLonekorningListaProps) {
  // State
  const [lonekorningar, setLonekorningar] = useState<Lönekörning[]>([]);
  const [loading, setLoading] = useState(true);

  // Effects
  useEffect(() => {
    loadLonekorningar();
  }, [refreshTrigger]);

  // Data loading
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

  // Utility functions
  const formatPeriodName = (period: string): string => {
    const [år, månad] = period.split("-");
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
  };

  const getItemClassName = (lonekorning: Lönekörning, valdLonekorning?: Lönekörning | null) => {
    return `
      p-4 rounded-lg border-2 cursor-pointer transition-all hover:border-cyan-500
      ${
        valdLonekorning?.id === lonekorning.id
          ? "border-cyan-500 bg-slate-700"
          : "border-slate-600 bg-slate-800 hover:bg-slate-700"
      }
    `;
  };

  // Computed values
  const hasLonekorningar = lonekorningar.length > 0;

  return {
    // State
    lonekorningar,
    loading,

    // Computed
    hasLonekorningar,

    // Functions
    formatPeriodName,
    getItemClassName,
    loadLonekorningar,
  };
}
