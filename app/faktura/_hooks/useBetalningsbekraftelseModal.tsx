"use client";

import { ColumnDefinition } from "../../_components/Tabell";
import { formatSEK } from "../../_utils/format";
import { BetalningsPost, UseBetalningsbekraftelseModalProps } from "../_types/types";

export function useBetalningsbekraftelseModal({
  leverantör,
  fakturanummer,
  belopp,
}: UseBetalningsbekraftelseModalProps) {
  // Generera bokföringsposter
  const poster: BetalningsPost[] = [
    {
      konto: "1930",
      kontoNamn: "Företagskonto / affärskonto",
      debet: 0,
      kredit: belopp,
    },
    {
      konto: "2440",
      kontoNamn: "Leverantörsskulder",
      debet: belopp,
      kredit: 0,
    },
  ];

  // Column-definitioner för tabellen
  const columns: ColumnDefinition<BetalningsPost>[] = [
    {
      key: "konto",
      label: "Konto",
      render: (value, post) => (
        <div>
          <div className="font-medium text-white">{post.konto}</div>
          <div className="text-sm text-gray-400">{post.kontoNamn}</div>
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

  // Beräkna totaler
  const totalDebet = poster.reduce((sum, post) => sum + post.debet, 0);
  const totalKredit = poster.reduce((sum, post) => sum + post.kredit, 0);

  return {
    poster,
    columns,
    totalDebet,
    totalKredit,
    leverantör,
    fakturanummer,
    belopp,
  };
}
