"use client";

/**
 * useSparadeFakturor.ts
 *
 * Hantering av sparade fakturor:
 * - Navigation till redigering av sparad faktura
 * - Ladda sparade fakturor med kunder och artiklar
 * - Cache-hantering för Sparade-sidan
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { hamtaSparadeFakturor } from "../../actions/fakturaActions";
import { hamtaSparadeKunder } from "../../actions/kundActions";
import { hamtaSparadeArtiklar } from "../../actions/artikelActions";
import { useFakturaInitialData } from "../../context/hooks/FakturaContext";
import {
  UseSparadeFakturorReturn,
  UseSparadeFakturorPageReturn,
  SparadeFakturorPageData,
  KundListItem,
  FavoritArtikel,
} from "../../types/types";

// =============================================================================
// CACHE-HANTERING
// =============================================================================

let sparadeFakturorPageCache: SparadeFakturorPageData | null = null;
let sparadeFakturorPagePromise: Promise<SparadeFakturorPageData | null> | null = null;

type SparadePageOptions = {
  force?: boolean;
  initialKunder?: KundListItem[] | null;
  initialArtiklar?: FavoritArtikel[] | null;
};

// I Next.js dev-läge kör React samma useEffect två gånger för att hitta biverkningar (Strict Mode).
// För att undvika att Sparade-vyn triggar dubbla POST-anrop bygger vi därför en enkel cache som delar
// på samma fetch/promise. När vi tvingar om-laddning rensar vi cachen och hämtar färska data.
async function ensureSparadeFakturorPageData(
  options: SparadePageOptions = {}
): Promise<SparadeFakturorPageData | null> {
  const { force = false, initialKunder, initialArtiklar } = options;

  if (!force) {
    if (sparadeFakturorPageCache) {
      return sparadeFakturorPageCache;
    }
    if (sparadeFakturorPagePromise) {
      return sparadeFakturorPagePromise;
    }
  }

  const fetchPromise = (async () => {
    try {
      const useInitialKunder = !force && initialKunder && initialKunder.length > 0;
      const useInitialArtiklar = !force && initialArtiklar && initialArtiklar.length > 0;

      const kunderPromise = useInitialKunder
        ? Promise.resolve(initialKunder)
        : hamtaSparadeKunder();
      const artiklarPromise = useInitialArtiklar
        ? Promise.resolve(initialArtiklar as FavoritArtikel[])
        : hamtaSparadeArtiklar();

      const [kunder, fakturor, artiklar] = await Promise.all([
        kunderPromise,
        hamtaSparadeFakturor(),
        artiklarPromise,
      ]);

      sparadeFakturorPageCache = {
        kunder: kunder ?? [],
        fakturor: fakturor ?? [],
        artiklar: (artiklar as FavoritArtikel[]) ?? [],
      };

      return sparadeFakturorPageCache;
    } catch (error) {
      console.error("[useSparadeFakturor] kunde inte ladda Sparade-fakturor: ", error);
      throw error;
    } finally {
      sparadeFakturorPagePromise = null;
    }
  })();

  sparadeFakturorPagePromise = fetchPromise;
  return fetchPromise;
}

function resetSparadeFakturorPageCache() {
  sparadeFakturorPageCache = null;
  sparadeFakturorPagePromise = null;
}

export { resetSparadeFakturorPageCache };

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook för sparade fakturor (simplified for list view only)
 */
export function useSparadeFakturor(): UseSparadeFakturorReturn {
  const router = useRouter();

  // Funktion för att hantera när en faktura väljs
  const hanteraValdFaktura = useCallback(
    async (fakturaId: number) => {
      // Navigera till NyFaktura med faktura-ID som parameter
      // Data kommer att laddas på NyFaktura-sidan baserat på detta ID
      router.push(`/faktura/NyFaktura?edit=${fakturaId}`);
    },
    [router]
  );

  return {
    hanteraValdFaktura,
  };
}

/**
 * Hook för Sparade page data loading
 */
export function useSparadeFakturorPage(): UseSparadeFakturorPageReturn {
  const initialData = useFakturaInitialData();
  const initialKunder = initialData?.kunder ?? null;
  const initialArtiklar = initialData?.artiklar ?? null;
  const [data, setData] = useState<SparadeFakturorPageData | null>(() =>
    sparadeFakturorPageCache ? { ...sparadeFakturorPageCache } : null
  );
  const [loading, setLoading] = useState(!sparadeFakturorPageCache);

  // Exponera en reload som även rensar cachen så att manuella uppdateringar hämtar färska värden.
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      resetSparadeFakturorPageCache();
      const result = await ensureSparadeFakturorPageData({ force: true });
      setData(result ?? null);
    } catch (error) {
      console.error("Fel vid uppdatering av Sparade-fakturor:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Första laddningen tar hänsyn till server-hydrerade kunder/artiklar och återanvänder
  // samma promise även om Strict Mode kör effekten två gånger i dev-läge.
  useEffect(() => {
    let cancelled = false;

    ensureSparadeFakturorPageData({
      initialKunder,
      initialArtiklar,
    })
      .then((result) => {
        if (cancelled) return;
        setData(result ?? null);
        setLoading(false);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Fel vid laddning av Sparade-fakturor:", error);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [initialKunder, initialArtiklar]);

  // Lyssna på reload-event från radering/sparning
  useEffect(() => {
    const handleReload = () => {
      loadData();
    };

    window.addEventListener("reloadFakturor", handleReload);
    return () => {
      window.removeEventListener("reloadFakturor", handleReload);
    };
  }, [loadData]);

  return {
    data,
    loading,
    loadData,
  };
}
