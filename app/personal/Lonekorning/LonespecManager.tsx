"use client";

interface LonespecManagerProps {
  valdaSpecar: any[];
  setValdaSpecar: (value: any[] | ((prev: any[]) => any[])) => void;
  specarPerDatum: any;
  setSpecarPerDatum: (value: any | ((prev: any) => any)) => void;
  datumLista: string[];
  setDatumLista: (value: string[] | ((prev: string[]) => string[])) => void;
  utbetalningsdatum: string | null;
  setUtbetalningsdatum: (value: string | null) => void;
}

export default function LonespecManager({
  valdaSpecar,
  setValdaSpecar,
  specarPerDatum,
  setSpecarPerDatum,
  datumLista,
  setDatumLista,
  utbetalningsdatum,
  setUtbetalningsdatum,
}: LonespecManagerProps) {
  const hanteraTaBortSpec = async (specId: number) => {
    // Importera taBortLönespec från actions om det behövs
    const { taBortLönespec } = await import("../actions");
    const resultat = await taBortLönespec(specId);
    if (resultat.success) {
      alert("✅ Lönespecifikation borttagen!");
      // Ta bort från state
      setValdaSpecar((prev) => prev.filter((s: any) => s.id !== specId));
      setSpecarPerDatum((prev: any) => {
        const updated = { ...prev };
        if (utbetalningsdatum && updated[utbetalningsdatum]) {
          updated[utbetalningsdatum] = updated[utbetalningsdatum].filter(
            (s: any) => s.id !== specId
          );
          // If no lönespecar left for this date, remove the date
          if (updated[utbetalningsdatum].length === 0) {
            delete updated[utbetalningsdatum];
          }
        }
        return updated;
      });
      setDatumLista((prev) => {
        const filtered = prev.filter((d) => {
          // Only keep dates that still have lönespecar
          return (
            specarPerDatum[d] && specarPerDatum[d].filter((s: any) => s.id !== specId).length > 0
          );
        });
        // If current utbetalningsdatum is now empty, clear selection
        if (utbetalningsdatum && filtered.indexOf(utbetalningsdatum) === -1) {
          setUtbetalningsdatum(filtered[0] || null);
        }
        return filtered;
      });
    } else {
      alert(`❌ Kunde inte ta bort lönespec: ${resultat.message}`);
    }
  };

  return {
    hanteraTaBortSpec,
  };
}
