"use client";

import { useCallback, useMemo } from "react";
import type { Lönespec } from "../types/types";

interface UseLonespecListOptions {
  lönespecar?: Lönespec[];
  taBortLaddning?: Record<number, boolean>;
  taBortLoading?: boolean;
}

export function useLonespecList({
  lönespecar,
  taBortLaddning,
  taBortLoading,
}: UseLonespecListOptions) {
  const lista = useMemo(() => lönespecar ?? [], [lönespecar]);
  const taBortStatus = useMemo(() => taBortLaddning ?? {}, [taBortLaddning]);

  const resolveTaBortLoading = useCallback(
    (id: number) => {
      if (typeof taBortLoading === "boolean") {
        return taBortLoading;
      }
      return taBortStatus[id] ?? false;
    },
    [taBortLoading, taBortStatus]
  );

  const hasItems = lista.length > 0;

  return {
    lista,
    hasItems,
    resolveTaBortLoading,
  };
}
