"use client";

import { useState, useCallback } from "react";
import type { Lönespec } from "../_types/types";

export function useLonespec() {
  const [lönespecar, setLonespecar] = useState<Lönespec[]>([]);
  const [extrarader, setExtraraderState] = useState<Record<string, any[]>>({});
  const [beräknadeVärden, setBeräknadeVärdenState] = useState<Record<string, any>>({});

  const setExtrarader = useCallback((id: string, extrarader: any[]) => {
    setExtraraderState((prev) => ({ ...prev, [id]: extrarader }));
  }, []);

  const setBeräknadeVärden = useCallback((id: string, värden: any) => {
    setBeräknadeVärdenState((prev) => ({ ...prev, [id]: värden }));
  }, []);

  return {
    lönespecar,
    setLonespecar,
    extrarader,
    setExtrarader,
    beräknadeVärden,
    setBeräknadeVärden,
  };
}
