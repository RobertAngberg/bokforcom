"use client";

/**
 * useVerifikat.ts
 *
 * Hantering av verifikat modal:
 * - Hämta transaktionsposter för ett verifikat
 * - Visa konton med debet/kredit
 * - Kolumndefinitioner för tabellen
 * - Beräkna totaler
 */

import { useState, useEffect, useCallback } from "react";
import { hamtaTransaktionsposter } from "../../actions/alternativActions";
import { formatSEK } from "../../../_utils/format";
import { ColumnDefinition } from "../../../_components/Tabell";
import { TransaktionsPost } from "../../types/types";

// =============================================================================
// HJÄLPFUNKTIONER
// =============================================================================

function ensureLeverantorskonto(poster: TransaktionsPost[]): TransaktionsPost[] {
  if (!poster.length) {
    return poster;
  }

  const hasLeverantorskonto = poster.some((post) => post.kontonummer === "2440");
  const totalDebet = poster.reduce((sum, post) => sum + (post.debet ?? 0), 0);
  const totalKredit = poster.reduce((sum, post) => sum + (post.kredit ?? 0), 0);
  const diff = Number((totalDebet - totalKredit).toFixed(2));

  if (hasLeverantorskonto || Math.abs(diff) < 0.01) {
    return poster;
  }

  const datum = poster[0].transaktionsdatum ?? "";
  const kommentar = poster[0].transaktionskommentar ?? "";

  return [
    ...poster,
    {
      id: Number.MAX_SAFE_INTEGER,
      kontonummer: "2440",
      kontobeskrivning: "Leverantörsskulder",
      debet: diff < 0 ? Math.abs(diff) : 0,
      kredit: diff > 0 ? diff : 0,
      transaktionsdatum: datum,
      transaktionskommentar: kommentar,
    },
  ];
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook för verifikat modal
 */
export function useVerifikatModal({
  isOpen,
  transaktionId,
  fakturanummer,
  leverantör,
}: {
  isOpen: boolean;
  transaktionId: number | null;
  fakturanummer?: string;
  leverantör?: string;
}) {
  // State management
  const [poster, setPoster] = useState<TransaktionsPost[]>([]);
  const [loading, setLoading] = useState(false);

  const hamtaPoster = useCallback(async () => {
    if (!transaktionId) return;

    setLoading(true);
    console.log("🔍 Hämtar verifikat för transaktionId:", transaktionId);
    try {
      const result = await hamtaTransaktionsposter(transaktionId);
      console.log("📝 Verifikat-resultat:", result);
      if (Array.isArray(result)) {
        const rows = ensureLeverantorskonto(result as TransaktionsPost[]);
        setPoster(rows);
      }
    } catch (error) {
      console.error("Fel vid hämtning av transaktionsposter:", error);
    } finally {
      setLoading(false);
    }
  }, [transaktionId]);

  // Data fetching effect
  useEffect(() => {
    if (isOpen && transaktionId) {
      hamtaPoster();
    }
  }, [isOpen, transaktionId, hamtaPoster]);

  // Column definitions for table (without JSX render functions)
  const columns: ColumnDefinition<TransaktionsPost>[] = [
    {
      key: "kontonummer",
      label: "Konto",
      render: (_value, row) =>
        `${row.kontonummer}${row.kontobeskrivning ? ` - ${row.kontobeskrivning}` : ""}`,
    },
    {
      key: "debet",
      label: "Debet",
      className: "text-right",
      render: (_value, row) => (row.debet > 0 ? formatSEK(row.debet) : "—"),
    },
    {
      key: "kredit",
      label: "Kredit",
      className: "text-right",
      render: (_value, row) => (row.kredit > 0 ? formatSEK(row.kredit) : "—"),
    },
  ];

  // Calculate totals
  const totalDebet = poster.reduce((sum, post) => sum + post.debet, 0);
  const totalKredit = poster.reduce((sum, post) => sum + post.kredit, 0);

  // Modal title logic
  const modalTitle = ""; // Tom titel så Modal.tsx inte visar den
  const verifikatNr = transaktionId ? `V${transaktionId}` : "";
  const headerTitle = leverantör
    ? `${verifikatNr} - ${leverantör}${fakturanummer ? ` (${fakturanummer})` : ""}`
    : `${verifikatNr}${fakturanummer ? ` (${fakturanummer})` : ""}`;

  return {
    // State
    poster,
    loading,

    // Computed data
    columns,
    totalDebet,
    totalKredit,
    modalTitle,
    headerTitle,

    // Actions
    hamtaPoster,
  };
}
