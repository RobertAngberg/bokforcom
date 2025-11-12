import type { MomsRad, TransaktionsPost } from "../types/types";

/**
 * Processar momsrapport lokalt från transaktionsdata
 * INGEN databasfetching - bara beräkningar på befintlig data
 *
 * @param transaktioner - All transaktionsdata för året
 * @param year - Årstal (används för filtrering)
 * @param period - Period (t.ex. "Q1", "M01" eller "all")
 * @returns Array av MomsRad objekt
 */
export function processMomsData(
  transaktioner: TransaktionsPost[],
  year: string,
  period?: string
): MomsRad[] {
  // Filtrera transaktioner baserat på period
  const filtrerade = filterByPeriod(transaktioner, year, period || "all");

  /* ---- hjälpstrukturer ---- */
  const fältMap: Record<string, { fält: string; beskrivning: string; belopp: number }> = {};
  const add = (fält: string, beskrivning: string, belopp: number) => {
    if (!fältMap[fält]) fältMap[fält] = { fält, beskrivning, belopp: 0 };
    fältMap[fält].belopp += belopp;
  };

  /* ---- loopa rader ---- */
  for (const r of filtrerade) {
    const { kontonummer, debet, kredit } = r;

    const netto = kredit - debet;

    /* A. Försäljning */
    if (/^30\d\d$/.test(kontonummer) || /^31\d\d$/.test(kontonummer))
      add("05", "Momspliktig försäljning", netto);

    /* B. Utgående moms */
    if (["2610", "2611", "2612", "2613"].includes(kontonummer))
      add("10", "Utgående moms 25%", kredit);
    if (["2620", "2621", "2622", "2623"].includes(kontonummer))
      add("11", "Utgående moms 12%", kredit);
    if (["2630", "2631", "2632", "2633"].includes(kontonummer))
      add("12", "Utgående moms 6%", kredit);

    /* C. Inköp med omvänd moms (varor/tjänster) */
    if (["4515", "4516", "4517"].includes(kontonummer)) add("20", "Inköp varor från EU", debet);
    if (["4535", "4536", "4537"].includes(kontonummer)) add("21", "Inköp tjänster från EU", debet);
    if (["4531", "4532", "4533"].includes(kontonummer))
      add("22", "Inköp tjänster utanför EU", debet);
    if (["4425", "213", "214"].includes(kontonummer))
      add("24", "Inköp tjänster i Sverige (omv. moms)", debet);

    /* D. Utgående moms omvänd */
    if (["2614"].includes(kontonummer)) add("30", "Utgående moms 25% (omv moms)", kredit);
    if (["2624"].includes(kontonummer)) add("31", "Utgående moms 12% (omv moms)", kredit);
    if (["2634"].includes(kontonummer)) add("32", "Utgående moms 6% (omv moms)", kredit);

    /* H + I. Import */
    if (["4545", "4546", "4547"].includes(kontonummer))
      add("50", "Beskattningsunderlag import", debet);
    if (["2615"].includes(kontonummer)) add("60", "Utgående moms 25% (import)", kredit);
    if (["2625"].includes(kontonummer)) add("61", "Utgående moms 12% (import)", kredit);
    if (["2635"].includes(kontonummer)) add("62", "Utgående moms 6% (import)", kredit);

    /* F. Ingående moms */
    if (
      ["2640", "2641", "2645", "2647", "2648", "2650", "210", "248", "250", "251"].includes(
        kontonummer
      )
    ) {
      add("48", "Ingående moms att dra av", debet);
    }

    /* E. Momsfri försäljning */
    if (kontonummer === "3108") add("35", "Varuförsäljning till EU", netto);
    if (kontonummer === "252") add("36", "Export varor utanför EU", netto);
    if (kontonummer === "192") add("39", "Tjänst till EU", netto);
    if (kontonummer === "191") add("40", "Tjänst utanför EU", netto);
    if (["3300", "3305"].includes(kontonummer)) add("41", "Försäljning med omv moms", netto);
  }

  /* ---- summeringar ---- */
  const sumFält = (...fält: string[]) => fält.reduce((s, f) => s + (fältMap[f]?.belopp ?? 0), 0);

  const utgående = sumFält("10", "11", "12", "30", "31", "32", "60", "61", "62");
  const ingående = fältMap["48"]?.belopp ?? 0;

  const moms49 = utgående - ingående;

  fältMap["49"] = {
    fält: "49",
    beskrivning: "Moms att betala eller få tillbaka",
    belopp: moms49,
  };

  /* sorterat resultat */
  return Object.values(fältMap)
    .filter((r) => r.belopp !== 0)
    .sort((a, b) => Number(a.fält) - Number(b.fält));
}

/**
 * Hjälpfunktion för att filtrera transaktioner baserat på period
 */
function filterByPeriod(
  transaktioner: TransaktionsPost[],
  year: string,
  period: string
): TransaktionsPost[] {
  if (period === "all") {
    return transaktioner;
  }

  // Hantera kvartal (Q1, Q2, Q3, Q4)
  if (period.startsWith("Q")) {
    const quarter = parseInt(period.substring(1));
    const startMonth = (quarter - 1) * 3 + 1;
    const endMonth = startMonth + 2;

    return transaktioner.filter((t) => {
      const datum = new Date(t.transaktionsdatum);
      const month = datum.getMonth() + 1; // getMonth() är 0-indexerad
      return month >= startMonth && month <= endMonth;
    });
  }

  // Hantera månad (M01, M02, etc.)
  if (period.startsWith("M")) {
    const month = parseInt(period.substring(1));

    return transaktioner.filter((t) => {
      const datum = new Date(t.transaktionsdatum);
      return datum.getMonth() + 1 === month;
    });
  }

  // Fallback: returnera allt
  return transaktioner;
}
