"use client";

import React from "react";
import LonespecList from "./LonespecList";
import LoadingSpinner from "../../../../_components/LoadingSpinner";
import { useLonespecarComponent } from "../../../hooks/useLonespecarComponent";

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
  const { utlägg, loading } = useLonespecarComponent({
    anställd,
    specificLönespec,
  });

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
