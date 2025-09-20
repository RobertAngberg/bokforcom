"use client";

import React, { useState, useEffect, useCallback } from "react";
import { hämtaLönespecifikationer } from "../_actions/lonespecarActions";
import { hämtaUtlägg } from "../_actions/utlaggActions";
import LonespecList from "./LonespecList";
import LoadingSpinner from "../../_components/LoadingSpinner";
import { useLonespec } from "../_hooks/useLonespec";

export default function Lonespecar({
  anställd,
  specificLönespec,
  ingenAnimering,
  onTaBortLönespec,
  taBortLoading,
  visaExtraRader = false,
}: {
  anställd: any;
  specificLönespec?: any;
  ingenAnimering?: boolean;
  onTaBortLönespec?: () => void;
  taBortLoading?: boolean;
  visaExtraRader?: boolean;
}) {
  const {
    lönespecar,
    setLonespecar,
    extrarader,
    setExtrarader,
    beräknadeVärden,
    setBeräknadeVärden,
  } = useLonespec();
  const [utlägg, setUtlägg] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (specificLönespec) {
      setLonespecar([specificLönespec]);
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
      setLonespecar(lönespecarData);
      setUtlägg(utläggData);
    } catch (error) {
      console.error("Fel vid laddning av data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBeräkningarUppdaterade = useCallback(
    (lönespecId: string, beräkningar: any) => {
      setBeräknadeVärden(lönespecId, beräkningar);
    },
    [setBeräknadeVärden]
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <LonespecList
      anställd={anställd}
      utlägg={utlägg}
      ingenAnimering={ingenAnimering}
      onTaBortLönespec={onTaBortLönespec}
      taBortLoading={taBortLoading}
      onLönespecUppdaterad={() => {}}
      visaExtraRader={visaExtraRader}
    />
  );
}
