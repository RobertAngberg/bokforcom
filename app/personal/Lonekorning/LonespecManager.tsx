"use client";

import { useState } from "react";

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
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const hanteraTaBortSpec = async (specId: number) => {
    // Importera taBortLönespec från actions om det behövs
    const { taBortLönespec } = await import("../_actions/lonespecarActions");
    const resultat = await taBortLönespec(specId);
    if (resultat.success) {
      setToast({ type: "success", message: "Lönespecifikation borttagen!" });
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
      setToast({ type: "error", message: `Kunde inte ta bort lönespec: ${resultat.message}` });
    }
  };

  return {
    hanteraTaBortSpec,
    toast,
    setToast,
  };
}
