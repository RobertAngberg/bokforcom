// formaterar ett tal till svenskt format utan decimaler, t.ex. "1 234"
export function formatSEK(v: number): string {
  return v.toLocaleString("sv-SE", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// rundar ett tal till två decimaler
export function round(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

// konverterar en sträng med , eller . till ett tal, returnerar 0 om fel
export function parseNumber(s: string): number {
  return parseFloat(s.replace(",", ".")) || 0;
}

// summerar en viss nyckel (debet eller kredit) i en array av objekt
export function summeraFält(
  arr: { debet?: number; kredit?: number }[],
  field: "debet" | "kredit"
): number {
  const summa = arr.reduce((sum, row) => {
    return sum + (row[field] ?? 0);
  }, 0);

  return round(summa);
}
