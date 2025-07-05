"use client";

import { useState, useEffect, useCallback } from "react";
import { hämtaLönespecifikationer, hämtaUtlägg, hämtaFöretagsprofil } from "../actions";
import LönespecList from "./LönespecList";
import LoadingSpinner from "../../_components/LoadingSpinner";
import Förhandsgranskning from "./Förhandsgranskning/Förhandsgranskning";
import MailaLönespec from "./MailaLönespec";
import Knapp from "../../_components/Knapp";

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
  const [företagsprofil, setFöretagsprofil] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [visaFörhandsgranskning, setVisaFörhandsgranskning] = useState<string | null>(null);
  const [beräknadeVärden, setBeräknadeVärden] = useState<any>({});
  const [extrarader, setExtrarader] = useState<any[]>([]);
  const [extraraderFörSpec, setExtraraderFörSpec] = useState<any[]>([]);

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

      const session = await fetch("/api/session").then((r) => r.json());
      if (session?.user?.id) {
        const företagsprofilData = await hämtaFöretagsprofil(session.user.id);
        setFöretagsprofil(företagsprofilData);
      }
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

  // När användaren klickar på förhandsgranskning, plocka extrarader för rätt lönespec
  const handleFörhandsgranskning = (lönespecId: string) => {
    setVisaFörhandsgranskning(lönespecId);
    const spec = lönespecar.find((l) => l.id === lönespecId);
    if (spec && Array.isArray(spec.extrarader)) {
      setExtraraderFörSpec(spec.extrarader);
    } else {
      setExtraraderFörSpec([]);
    }
  };

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
        onFörhandsgranskning={handleFörhandsgranskning}
        onBeräkningarUppdaterade={handleBeräkningarUppdaterade}
        beräknadeVärden={beräknadeVärden}
        ingenAnimering={ingenAnimering}
        onTaBortLönespec={onTaBortLönespec}
        taBortLoading={taBortLoading}
        extrarader={extrarader}
        setExtrarader={setExtrarader}
        onLönespecUppdaterad={loadData}
        företagsprofil={företagsprofil}
      />

      {visaFörhandsgranskning && (
        <Förhandsgranskning
          lönespec={lönespecar.find((l) => l.id === visaFörhandsgranskning)}
          anställd={anställd}
          företagsprofil={företagsprofil}
          extrarader={extraraderFörSpec}
          beräknadeVärden={beräknadeVärden[visaFörhandsgranskning] || {}}
          onStäng={() => setVisaFörhandsgranskning(null)}
        />
      )}
    </>
  );
}
