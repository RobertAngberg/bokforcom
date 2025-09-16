"use client";

import { useState, useEffect, useCallback } from "react";
import { getLeverantörer, type Leverantör } from "../actions";
import { safeAsync, logError, createError } from "../../_utils/errorUtils";

interface UseLeverantörerReturn {
  leverantörer: Leverantör[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  harLeverantörer: boolean;
}

export function useLeverantörer(): UseLeverantörerReturn {
  const [leverantörer, setLeverantörer] = useState<Leverantör[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeverantörer = useCallback(async () => {
    const result = await safeAsync(
      async () => {
        const apiResult = await getLeverantörer();

        if (!apiResult.success) {
          throw createError("API returned success: false", {
            code: "API_ERROR",
            context: { apiResult },
          });
        }

        return apiResult.leverantörer || [];
      },
      {
        operationName: "loadLeverantörer",
        fallback: [],
      }
    );

    if (result) {
      setLeverantörer(result);
      setError(null);
    } else {
      setError("Kunde inte ladda leverantörer");
    }

    setLoading(false);
  }, []);

  // Initial load
  useEffect(() => {
    loadLeverantörer();
  }, [loadLeverantörer]);

  const refresh = useCallback(async () => {
    await loadLeverantörer();
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
