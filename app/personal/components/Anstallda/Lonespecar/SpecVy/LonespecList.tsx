"use client";

import LönespecView from "./LonespecView";
import type { LonespecListProps } from "../../../../types/types";
import { useLonespecList } from "../../../../hooks/useLonespecList";

export default function LonespecList({
  anställd,
  lönespecar,
  utlägg,
  ingenAnimering,
  onTaBortLönespec,
  taBortLoading,
  taBortLaddning,
  visaExtraRader = false,
}: LonespecListProps) {
  const { lista, hasItems, resolveTaBortLoading } = useLonespecList({
    lönespecar,
    taBortLaddning,
    taBortLoading,
  });

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {!hasItems ? (
        <div className="text-center py-8 text-gray-400">
          <div className="mb-4">
            Inga slutförda lönespecifikationer hittades för {anställd.namn}.
          </div>
          <div className="text-sm text-gray-500 mb-4">
            Lönespecifikationer kopplade till ej slutförda lönekörningar kan finnas.
          </div>
          {/* Knapp borttagen tills lönekörningsflödet är redo */}
        </div>
      ) : (
        lista.map((lönespec) => (
          <LönespecView
            key={lönespec.id}
            lönespec={lönespec}
            anställd={anställd}
            utlägg={utlägg}
            ingenAnimering={ingenAnimering}
            onTaBortLönespec={onTaBortLönespec}
            taBortLoading={resolveTaBortLoading(lönespec.id)}
            visaExtraRader={visaExtraRader}
          />
        ))
      )}
    </div>
  );
}
