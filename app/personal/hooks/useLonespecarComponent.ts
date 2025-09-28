import { useState, useEffect } from "react";
import { hämtaLönespecifikationer } from "../actions/lonespecarActions";
import { hämtaUtlägg } from "../actions/utlaggActions";
import { useLonespec } from "./useLonespecar";

interface UseLonespecarComponentProps {
  anställd: any;
  specificLönespec?: any;
}

export function useLonespecarComponent({
  anställd,
  specificLönespec,
}: UseLonespecarComponentProps) {
  const { setLonespecar } = useLonespec();

  // State
  const [utlägg, setUtlägg] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Effects
  useEffect(() => {
    if (specificLönespec) {
      setLonespecar([specificLönespec]);
      setLoading(false);
      return;
    }
    loadData();
  }, [anställd?.id, specificLönespec]);

  // Data loading
  const loadData = async () => {
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
  };

  return {
    // State
    utlägg,
    loading,

    // Functions
    loadData,
  };
}
