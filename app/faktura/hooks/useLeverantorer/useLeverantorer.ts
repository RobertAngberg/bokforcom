"use client";

/**
 * useLeverantorer.ts
 *
 * Huvudhook för att hämta och hantera leverantörer
 */

import { useState, useEffect, useCallback } from "react";
import { Leverantör, UseLeverantörerReturn } from "../../types/types";
import {
  ensureLeverantorer,
  getLeverantorerCache,
  leverantorerErrorCache,
} from "./leverantorCache";

/**
 * Hook för att hämta och refresha leverantörer
 */
export function useLeverantörer(): UseLeverantörerReturn {
  const [leverantörer, setLeverantörer] = useState(() => getLeverantorerCache() ?? []);
  const [loading, setLoading] = useState(!getLeverantorerCache());
  const [error, setError] = useState<string | null>(null);

  const syncState = useCallback((data: Leverantör[] | null) => {
    setLeverantörer(data ?? []);
    setError(leverantorerErrorCache);
    setLoading(false);
  }, []);

  const loadLeverantörer = useCallback(
    async (force = false) => {
      setLoading(true);
      try {
        const data = await ensureLeverantorer(force);
        syncState(data);
      } catch (err) {
        console.error("[useLeverantörer] loadLeverantörer misslyckades", err);
        setLeverantörer([]);
        setError("Kunde inte ladda leverantörer");
        setLoading(false);
      }
    },
    [syncState]
  );

  useEffect(() => {
    let cancelled = false;
    const cachedData = getLeverantorerCache();

    if (cachedData) {
      syncState(cachedData);
      return () => {
        cancelled = true;
      };
    }

    ensureLeverantorer()
      .then((data) => {
        if (cancelled) return;
        syncState(data);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[useLeverantörer] initial load misslyckades", err);
        setLeverantörer([]);
        setError("Kunde inte ladda leverantörer");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [syncState]);

  const refresh = useCallback(async () => {
    await loadLeverantörer(true);
  }, [loadLeverantörer]);

  const harLeverantörer = leverantörer.length > 0;

  return {
    leverantörer,
    loading,
    error,
    refresh,
    harLeverantörer,
  };
}
