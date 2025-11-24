"use client";

/**
 * useBokfordaFakturor.ts
 *
 * Hantering av bokförda leverantörsfakturor:
 * - Hämta bokförda fakturor (med cache)
 * - Betala och bokföra fakturor
 * - Ta bort fakturor
 * - Visa verifikat
 * - Bekräftelsemodal för bokföring
 */

import { useState, useEffect, useCallback } from "react";
import { hamtaBokfordaFakturor } from "../../actions/bokforingActions";
import {
  betalaOchBokforLeverantorsfaktura,
  taBortLeverantorsfaktura,
} from "../../actions/leverantorsfakturorActions";
import { showToast } from "../../../_components/Toast";
import { formatSEK } from "../../../_utils/format";
import { stringTillDate } from "../../../_utils/datum";
import { ColumnDefinition } from "../../../_components/Tabell";
import { BokfordFaktura, TransaktionsPost, UseBokfordaFakturorFlikReturn } from "../../types/types";

// =============================================================================
// CACHE-HANTERING
// =============================================================================

let bokfordaFakturorCache: BokfordFaktura[] | null = null;
let bokfordaFakturorPromise: Promise<BokfordFaktura[] | null> | null = null;

async function ensureBokfordaFakturor(force = false): Promise<BokfordFaktura[] | null> {
  if (!force) {
    if (bokfordaFakturorCache) {
      return bokfordaFakturorCache;
    }
    if (bokfordaFakturorPromise) {
      return bokfordaFakturorPromise;
    }
  }

  const fetchPromise = (async () => {
    try {
      const result = await hamtaBokfordaFakturor();

      if (!result || !result.success) {
        throw new Error("Failed to fetch bokförda fakturor");
      }

      bokfordaFakturorCache = result.fakturor || [];
      return bokfordaFakturorCache;
    } catch (error) {
      console.error("Fel vid hämtning av bokförda fakturor:", error);
      bokfordaFakturorCache = [];
      throw error;
    } finally {
      bokfordaFakturorPromise = null;
    }
  })();

  bokfordaFakturorPromise = fetchPromise;
  return fetchPromise;
}

function resetBokfordaCache() {
  bokfordaFakturorCache = null;
}

export { resetBokfordaCache };

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook för bokförda fakturor flik (visar endast antal)
 */
export function useBokfordaFakturorFlik(): UseBokfordaFakturorFlikReturn {
  const [fakturorAntal, setFakturorAntal] = useState(() => bokfordaFakturorCache?.length ?? 0);
  const [loading, setLoading] = useState(!bokfordaFakturorCache);

  const loadFakturorAntal = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ensureBokfordaFakturor(true);
      setFakturorAntal(data?.length ?? 0);
    } catch (error) {
      console.error("Fel vid hämtning av fakturor:", error);
      setFakturorAntal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    ensureBokfordaFakturor()
      .then((data) => {
        if (cancelled) return;
        setFakturorAntal(data?.length ?? 0);
        setLoading(false);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Fel vid hämtning av fakturor:", error);
        setFakturorAntal(0);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    fakturorAntal,
    loading,
    loadFakturorAntal,
  };
}

/**
 * Hook för fullständig hantering av bokförda fakturor
 */
export function useBokfordaFakturor() {
  // State management
  const [fakturor, setFakturor] = useState<BokfordFaktura[]>(() => bokfordaFakturorCache ?? []);
  const [loading, setLoading] = useState(!bokfordaFakturorCache);
  const [verifikatModal, setVerifikatModal] = useState<{
    isOpen: boolean;
    transaktionId: number;
    fakturanummer?: string;
    leverantör?: string;
  }>({
    isOpen: false,
    transaktionId: 0,
  });
  const [bekraftelseModal, setBekraftelseModal] = useState<{
    isOpen: boolean;
    faktura: BokfordFaktura | null;
    transaktionsposter: TransaktionsPost[];
    loadingPoster: boolean;
  }>({
    isOpen: false,
    faktura: null,
    transaktionsposter: [],
    loadingPoster: false,
  });
  const [showDeleteFakturaModal, setShowDeleteFakturaModal] = useState(false);
  const [deleteFakturaId, setDeleteFakturaId] = useState<number | null>(null);

  // Hjälpfunktion för att säkert formatera datum
  const formateraDatum = (datum: string | Date): string => {
    if (typeof datum === "string") {
      const dateObj = stringTillDate(datum);
      return dateObj ? dateObj.toLocaleDateString("sv-SE") : datum;
    }
    return datum.toLocaleDateString("sv-SE");
  };

  // Kolumndefinitioner för transaktionsposter tabellen
  const transaktionskolumner: ColumnDefinition<TransaktionsPost>[] = [
    {
      key: "konto",
      label: "Konto",
      render: (_: unknown, post: TransaktionsPost) =>
        `${post.kontonummer} - ${post.kontobeskrivning}`,
    },
    {
      key: "debet",
      label: "Debet",
      render: (_: unknown, post: TransaktionsPost) =>
        post.debet > 0 ? formatSEK(post.debet) : "—",
      className: "text-right",
    },
    {
      key: "kredit",
      label: "Kredit",
      render: (_: unknown, post: TransaktionsPost) =>
        post.kredit > 0 ? formatSEK(post.kredit) : "—",
      className: "text-right",
    },
  ];

  const loadFakturor = useCallback(async (force = false) => {
    setLoading(true);
    try {
      const data = await ensureBokfordaFakturor(force);
      setFakturor(data ?? []);
    } catch (error) {
      console.error("Fel vid hämtning av bokförda fakturor:", error);
      setFakturor([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Data fetching effect
  useEffect(() => {
    let cancelled = false;
    ensureBokfordaFakturor()
      .then((data) => {
        if (cancelled) return;
        setFakturor(data ?? []);
        setLoading(false);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Fel vid hämtning av bokförda fakturor:", error);
        setFakturor([]);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Event handlers
  const öppnaVerifikat = (faktura: BokfordFaktura) => {
    setVerifikatModal({
      isOpen: true,
      transaktionId: faktura.transaktionId || faktura.id,
      fakturanummer: faktura.fakturanummer,
      leverantör: faktura.leverantör,
    });
  };

  const stängVerifikat = () => {
    setVerifikatModal({
      isOpen: false,
      transaktionId: 0,
    });
  };

  const handleBetalaOchBokför = async (faktura: BokfordFaktura) => {
    const belopp = Math.abs(faktura.belopp || 0);

    const planeradePoster: TransaktionsPost[] = [
      {
        id: Number.MAX_SAFE_INTEGER - 1,
        kontonummer: "2440",
        kontobeskrivning: "Leverantörsskulder",
        debet: belopp,
        kredit: 0,
        transaktionsdatum: "",
        transaktionskommentar: "",
      },
      {
        id: Number.MAX_SAFE_INTEGER,
        kontonummer: "1930",
        kontobeskrivning: "Företagskonto",
        debet: 0,
        kredit: belopp,
        transaktionsdatum: "",
        transaktionskommentar: "",
      },
    ];

    setBekraftelseModal({
      isOpen: true,
      faktura,
      transaktionsposter: planeradePoster,
      loadingPoster: false,
    });
  };

  const stängBekraftelseModal = () => {
    setBekraftelseModal({
      isOpen: false,
      faktura: null,
      transaktionsposter: [],
      loadingPoster: false,
    });
  };

  const taBortFaktura = async (fakturaId: number) => {
    setDeleteFakturaId(fakturaId);
    setShowDeleteFakturaModal(true);
  };

  const confirmDeleteFaktura = async () => {
    if (!deleteFakturaId) return;

    setShowDeleteFakturaModal(false);

    try {
      const result = await taBortLeverantorsfaktura(deleteFakturaId);

      if (result.success) {
        await loadFakturor(true);
        showToast("Leverantörsfaktura borttagen!", "success");
      } else {
        showToast(`Fel vid borttagning: ${result.error}`, "error");
      }
    } catch (error) {
      console.error("Fel vid borttagning av faktura:", error);
      showToast("Fel vid borttagning av faktura", "error");
    }
  };

  const utförBokföring = async (faktura: BokfordFaktura) => {
    try {
      const result = await betalaOchBokforLeverantorsfaktura(faktura.id, faktura.belopp);

      if (result.success) {
        showToast("Leverantörsfaktura bokförd!", "success");
        await loadFakturor(true);
      } else {
        showToast(`Fel vid bokföring: ${result.error}`, "error");
      }
    } catch (error) {
      console.error("Fel vid bokföring:", error);
      showToast("Ett fel uppstod vid bokföring", "error");
    }
    stängBekraftelseModal();
  };

  return {
    // State
    fakturor,
    loading,
    verifikatModal,
    bekraftelseModal,
    showDeleteFakturaModal,
    setShowDeleteFakturaModal,
    deleteFakturaId,

    // Computed data
    transaktionskolumner,

    // Actions
    formateraDatum,
    öppnaVerifikat,
    stängVerifikat,
    handleBetalaOchBokför,
    stängBekraftelseModal,
    taBortFaktura,
    confirmDeleteFaktura,
    utförBokföring,
  };
}
