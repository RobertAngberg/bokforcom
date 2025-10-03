import { useState, useEffect, useCallback } from "react";
import { hämtaLönespecifikationer } from "../actions/lonespecarActions";
import { hämtaUtlägg } from "../actions/utlaggActions";
import { useLonespec } from "./useLonespecar";
import type { AnställdData, LönespecData, UtläggQueryResult } from "../types/types";

interface UseLonespecarComponentProps {
  anställd: AnställdData;
  specificLönespec?: LönespecData;
}

export function useLonespecarComponent({
  anställd,
  specificLönespec,
}: UseLonespecarComponentProps) {
  const { setLonespecar } = useLonespec();

  // State
  const [utlägg, setUtlägg] = useState<UtläggQueryResult[]>([]);
  const [loading, setLoading] = useState(true);

  // Data loading
  const loadData = useCallback(async () => {
    if (!anställd?.id) return;

    try {
      setLoading(true);
      const [lönespecarData, utläggData] = await Promise.all([
        hämtaLönespecifikationer(anställd.id),
        hämtaUtlägg(anställd.id),
      ]);
      setLonespecar(lönespecarData);
      setUtlägg(utläggData);
    } catch (error) {
      console.error("Fel vid laddning av data:", error);
    } finally {
      setLoading(false);
    }
  }, [anställd?.id, setLonespecar]);

  // Effects
  useEffect(() => {
    if (specificLönespec) {
      setLonespecar([{ ...specificLönespec, id: String(specificLönespec.id) }]);
      setLoading(false);
      return;
    }
    loadData();
  }, [specificLönespec, loadData, setLonespecar]);

  return {
    // State
    utlägg,
    loading,

    // Functions
    loadData,
  };
}
