export type Extrafält = Record<string, { label: string; debet: number; kredit: number }>;
export type ExtrafältRow = {
  konto: string;
  debet: number;
  kredit: number;
};

// summerar extrafält till rader + totalsumma
export function sammanfattaExtrafält(extrafält: Extrafält): {
  rows: ExtrafältRow[];
  totalDebet: number;
  totalKredit: number;
} {
  const rows: ExtrafältRow[] = [];
  let totalDebet = 0;
  let totalKredit = 0;

  for (const [konto, { label, debet, kredit }] of Object.entries(extrafält)) {
    rows.push({ konto: `${konto} ${label}`, debet, kredit });
    totalDebet += debet;
    totalKredit += kredit;
  }

  return { rows, totalDebet, totalKredit };
}
