"use client";

import { useState, useEffect, useCallback } from "react";
import { hämtaLönespecifikationer, hämtaUtlägg } from "../actions";
import LönespecList from "./LönespecList";
import LoadingSpinner from "../../_components/LoadingSpinner";

interface LönespecProps {
  anställd: any;
  specificLönespec?: any;
  ingenAnimering?: boolean;
  onTaBortLönespec?: () => void;
  taBortLoading?: boolean;
}

export default function Lönespecar({
  anställd,
  specificLönespec,
  ingenAnimering,
  onTaBortLönespec,
  taBortLoading,
}: LönespecProps) {
  const [lönespecar, setLönespecar] = useState<any[]>([]);
  const [utlägg, setUtlägg] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [beräknadeVärden, setBeräknadeVärden] = useState<any>({});
  const [extrarader, setExtrarader] = useState<any[]>([]);

  useEffect(() => {
    if (specificLönespec) {
      setLönespecar([specificLönespec]);
      setLoading(false);
      return;
    }

    loadData();
  }, [anställd?.id, specificLönespec]);

  const loadData = async () => {
    if (!anställd?.id) return;

    try {
      setLoading(true);
      const [lönespecarData, utläggData] = await Promise.all([
        hämtaLönespecifikationer(anställd.id),
        hämtaUtlägg(anställd.id),
      ]);

      setLönespecar(lönespecarData);
      setUtlägg(utläggData);
    } catch (error) {
      console.error("Fel vid laddning av data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBeräkningarUppdaterade = useCallback((lönespecId: string, beräkningar: any) => {
    setBeräknadeVärden((prev: any) => ({
      ...prev,
      [lönespecId]: beräkningar,
    }));
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  // Hämta aktuell lönespec för knapparna (t.ex. senaste)
  const aktuellLönespec = lönespecar.length > 0 ? lönespecar[0] : null;
  const aktuellaExtrarader = aktuellLönespec?.extrarader || [];

  return (
    <>
      <LönespecList
        lönespecar={lönespecar}
        anställd={anställd}
        utlägg={utlägg}
        onBeräkningarUppdaterade={handleBeräkningarUppdaterade}
        beräknadeVärden={beräknadeVärden}
        ingenAnimering={ingenAnimering}
        onTaBortLönespec={onTaBortLönespec}
        taBortLoading={taBortLoading}
        extrarader={extrarader}
        setExtrarader={setExtrarader}
        onLönespecUppdaterad={loadData}
      />
    </>
  );
}
