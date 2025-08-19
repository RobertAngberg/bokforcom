// formaterar ett tal till svenskt format utan decimaler, t.ex. "1 234"
export function formatSEK(v: number): string {
  return v.toLocaleString("sv-SE", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// formaterar ett tal som valuta med decimaler och kr, t.ex. "1 234,56 kr"
export function formatCurrency(v: number): string {
  return (
    v.toLocaleString("sv-SE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " kr"
  );
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

// Types för år-data
export type YearDataPoint = {
  month: string;
  inkomst: number;
  utgift: number;
};

export type YearSummary = {
  totalInkomst: number;
  totalUtgift: number;
  totalResultat: number;
  yearData: YearDataPoint[];
};

// Returnerar nuvarande år som sträng
export const getCurrentYear = (): string => {
  return new Date().getFullYear().toString();
};

// Centraliserad data-processing för år-data
export const processYearData = (rawData: any[]): YearSummary => {
  const grouped: Record<string, { inkomst: number; utgift: number }> = {};
  let totalInkomst = 0;
  let totalUtgift = 0;

  rawData.forEach((row, i) => {
    const { transaktionsdatum, debet, kredit, kontonummer } = row;

    if (!transaktionsdatum || !kontonummer) {
      // Bara logga i development
      if (process.env.NODE_ENV === "development") {
        console.warn(`⚠️ Rad ${i + 1} saknar datum eller kontonummer:`, row);
      }
      return;
    }

    const date = new Date(transaktionsdatum);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;

    const deb = Number(debet ?? 0);
    const kre = Number(kredit ?? 0);
    const prefix = kontonummer?.toString()[0];

    if (!grouped[key]) grouped[key] = { inkomst: 0, utgift: 0 };

    if (prefix === "3") {
      grouped[key].inkomst += kre;
      totalInkomst += kre;
    }

    if (["5", "6", "7", "8"].includes(prefix)) {
      grouped[key].utgift += deb;
      totalUtgift += deb;
    }
  });

  const yearData = Object.entries(grouped).map(([month, values]) => ({
    month,
    inkomst: values.inkomst,
    utgift: values.utgift,
  }));

  return {
    totalInkomst: +totalInkomst.toFixed(2),
    totalUtgift: +totalUtgift.toFixed(2),
    totalResultat: +(totalInkomst - totalUtgift).toFixed(2),
    yearData,
  };
};
