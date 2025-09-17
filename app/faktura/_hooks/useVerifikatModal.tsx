"use client";

import { useState, useEffect } from "react";
import { ColumnDefinition } from "../../_components/Tabell";
import { formatSEK } from "../../_utils/format";
import { hamtaTransaktionsposter } from "../_actions/bokforingActions";
import { TransaktionsPost, UseVerifikatModalProps } from "../_types/types";

export function useVerifikatModal({
  isOpen,
  transaktionId,
  fakturanummer,
  leverantör,
}: UseVerifikatModalProps) {
  // State management
  const [poster, setPoster] = useState<TransaktionsPost[]>([]);
  const [loading, setLoading] = useState(false);

  // Data fetching effect
  useEffect(() => {
    if (isOpen && transaktionId) {
      hämtaPoster();
    }
  }, [isOpen, transaktionId]);

  const hämtaPoster = async () => {
    setLoading(true);
    console.log("🔍 Hämtar verifikat för transaktionId:", transaktionId);
    try {
      const result = await hamtaTransaktionsposter(transaktionId);
      console.log("📝 Verifikat-resultat:", result);
      if (Array.isArray(result)) {
        setPoster(result as any);
      }
    } catch (error) {
      console.error("Fel vid hämtning av transaktionsposter:", error);
    } finally {
      setLoading(false);
    }
  };

  // Column definitions for table
  const columns: ColumnDefinition<TransaktionsPost>[] = [
    {
      key: "kontonummer",
      label: "Konto",
      render: (value, post) => (
        <div>
          <div className="font-medium text-white">{post.kontonummer}</div>
          <div className="text-sm text-gray-400">{post.kontobeskrivning}</div>
        </div>
      ),
    },
    {
      key: "debet",
      label: "Debet",
      render: (value, post) => (
        <div className="text-right text-white">{post.debet > 0 ? formatSEK(post.debet) : "-"}</div>
      ),
    },
    {
      key: "kredit",
      label: "Kredit",
      render: (value, post) => (
        <div className="text-right text-white">
          {post.kredit > 0 ? formatSEK(post.kredit) : "-"}
        </div>
      ),
    },
  ];

  // Calculate totals
  const totalDebet = poster.reduce((sum, post) => sum + post.debet, 0);
  const totalKredit = poster.reduce((sum, post) => sum + post.kredit, 0);

  // Modal title logic
  const modalTitle = ""; // Tom titel så Modal.tsx inte visar den
  const headerTitle = `Verifikat - ${leverantör || "Okänd leverantör"}${
    fakturanummer ? ` (${fakturanummer})` : ""
  }`;

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
    hämtaPoster,
  };
}
