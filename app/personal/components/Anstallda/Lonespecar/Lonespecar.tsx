"use client";

import React from "react";
import LonespecList from "./LonespecList";
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
  const { utlägg, loading } = useLonespec({
    enableComponentMode: true,
    anställdId: anställd?.id,
    specificLönespec,
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <LonespecList
      anställd={anställd}
      utlägg={utlägg || []}
      ingenAnimering={ingenAnimering}
      onTaBortLönespec={onTaBortLönespec}
      taBortLoading={taBortLoading}
      onLönespecUppdaterad={undefined}
      visaExtraRader={visaExtraRader}
    />
  );
}
