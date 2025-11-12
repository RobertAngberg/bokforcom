"use client";

import React from "react";
import LonespecList from "./SpecVy/LonespecList";
import LoadingSpinner from "../../../../_components/LoadingSpinner";
import { useLonespec } from "../../../hooks/useLonespecar";
import type { AnställdListItem, Lönespec } from "../../../types/types";

export default function Lonespecar({
  anställd,
  specificLönespec,
  ingenAnimering,
  onTaBortLönespec,
  taBortLoading,
  visaExtraRader = false,
}: {
  anställd: AnställdListItem;
  specificLönespec?: Lönespec;
  ingenAnimering?: boolean;
  onTaBortLönespec?: () => void;
  taBortLoading?: boolean;
  visaExtraRader?: boolean;
}) {
  const { lönespecar, utlägg, loading } = useLonespec({
    enableComponentMode: true,
    anställdId: anställd?.id,
    specificLönespec,
    // Data laddas nu automatiskt när komponenten mountas (tack vare lazy rendering i AnimeradFlik)
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <LonespecList
      anställd={anställd}
      lönespecar={lönespecar}
      utlägg={utlägg || []}
      ingenAnimering={ingenAnimering}
      onTaBortLönespec={onTaBortLönespec}
      taBortLoading={taBortLoading}
      onLönespecUppdaterad={undefined}
      visaExtraRader={visaExtraRader}
    />
  );
}
