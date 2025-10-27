// Gemensamma period-alternativ för alla rapporter
export const PERIOD_OPTIONS = [
  { label: "Alla månader", value: "all" },
  // Kvartal
  { label: "─────────────", value: "divider1", disabled: true },
  { label: "Kvartal 1 (Jan-Mar)", value: "Q1" },
  { label: "Kvartal 2 (Apr-Jun)", value: "Q2" },
  { label: "Kvartal 3 (Jul-Sep)", value: "Q3" },
  { label: "Kvartal 4 (Okt-Dec)", value: "Q4" },
  // Månader
  { label: "─────────────", value: "divider2", disabled: true },
  { label: "Januari", value: "01" },
  { label: "Februari", value: "02" },
  { label: "Mars", value: "03" },
  { label: "April", value: "04" },
  { label: "Maj", value: "05" },
  { label: "Juni", value: "06" },
  { label: "Juli", value: "07" },
  { label: "Augusti", value: "08" },
  { label: "September", value: "09" },
  { label: "Oktober", value: "10" },
  { label: "November", value: "11" },
  { label: "December", value: "12" },
];

// Helper för att konvertera period till datumintervall
export function getPeriodDateRange(year: string, period: string): { from: string; to: string } {
  if (period === "all") {
    return {
      from: `${year}-01-01`,
      to: `${year}-12-31`,
    };
  }

  // Kvartal
  if (period === "Q1") {
    return { from: `${year}-01-01`, to: `${year}-03-31` };
  }
  if (period === "Q2") {
    return { from: `${year}-04-01`, to: `${year}-06-30` };
  }
  if (period === "Q3") {
    return { from: `${year}-07-01`, to: `${year}-09-30` };
  }
  if (period === "Q4") {
    return { from: `${year}-10-01`, to: `${year}-12-31` };
  }

  // Månader (01-12)
  if (/^\d{2}$/.test(period)) {
    const monthNum = parseInt(period);
    const lastDay = new Date(parseInt(year), monthNum, 0).getDate();
    return {
      from: `${year}-${period}-01`,
      to: `${year}-${period}-${lastDay.toString().padStart(2, "0")}`,
    };
  }

  // Fallback till hela året
  return {
    from: `${year}-01-01`,
    to: `${year}-12-31`,
  };
}
