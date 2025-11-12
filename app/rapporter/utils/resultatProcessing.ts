import type {
  ResultatKonto,
  ResultatTransaktion,
  ResultatData,
  KontoRad,
  TransaktionsPost,
} from "../types/types";

/**
 * Processar resultatrapport lokalt från transaktionsdata
 * INGEN databasfetching - bara beräkningar på befintlig data
 *
 * @param transaktioner - All transaktionsdata för året
 * @param year - Årstal (används för filtrering)
 * @param period - Period (t.ex. "Q1", "M01" eller "all")
 * @returns ResultatData objekt med intäkter, kostnader etc.
 */
export function processResultatData(
  transaktioner: TransaktionsPost[],
  year?: string,
  period?: string
): ResultatData {
  // Filtrera transaktioner baserat på period
  const filtrerade = filterByPeriod(transaktioner, year, period);

  // Gruppera transaktioner per konto och år
  const kontoMap = new Map<
    string,
    {
      kontonummer: string;
      beskrivning: string;
      kontoklass: string;
      kategori: string;
      år: Map<string, { belopp: number; transaktioner: ResultatTransaktion[] }>;
    }
  >();

  for (const t of filtrerade) {
    const år = new Date(t.transaktionsdatum).getFullYear().toString();
    const netto = t.debet - t.kredit;

    if (!kontoMap.has(t.kontonummer)) {
      kontoMap.set(t.kontonummer, {
        kontonummer: t.kontonummer,
        beskrivning: t.kontobeskrivning,
        kontoklass: getKontoklass(t.kontonummer),
        kategori: getKategori(t.kontonummer),
        år: new Map(),
      });
    }

    const konto = kontoMap.get(t.kontonummer)!;
    if (!konto.år.has(år)) {
      konto.år.set(år, { belopp: 0, transaktioner: [] });
    }

    const årData = konto.år.get(år)!;
    årData.belopp += netto;
    årData.transaktioner.push({
      id: `ID${t.transaktions_id}`,
      datum: t.transaktionsdatum,
      belopp: netto,
      beskrivning: t.kontobeskrivning_transaktion,
      transaktion_id: t.transaktions_id,
      verifikatNummer: `V${t.transaktions_id}`,
    });
  }

  // Bygg upp struktur för resultatrapport
  const årsSet = new Set<string>();
  const intakterMap = new Map<string, Map<string, ResultatKonto>>();
  const rorelsensMap = new Map<string, Map<string, ResultatKonto>>();
  const finansiellaIntakterMap = new Map<string, Map<string, ResultatKonto>>();
  const finansiellaKostnaderMap = new Map<string, Map<string, ResultatKonto>>();

  for (const [kontonummer, kontoData] of kontoMap.entries()) {
    const { beskrivning, kategori, år: årMap } = kontoData;

    for (const [år, data] of årMap.entries()) {
      årsSet.add(år);

      let målMap: Map<string, Map<string, ResultatKonto>> | null = null;
      const grupp = kategori || "Övrigt";

      if (/^3/.test(kontonummer)) {
        målMap = intakterMap;
      } else if (/^[4-7]/.test(kontonummer)) {
        målMap = rorelsensMap;
      } else if (/^8[0-3]/.test(kontonummer)) {
        målMap = finansiellaIntakterMap;
      } else if (/^8[4-9]/.test(kontonummer)) {
        målMap = finansiellaKostnaderMap;
      }

      if (!målMap) continue;

      if (!målMap.has(grupp)) målMap.set(grupp, new Map());
      const kontoMap = målMap.get(grupp)!;

      if (!kontoMap.has(kontonummer)) {
        kontoMap.set(kontonummer, {
          kontonummer,
          beskrivning,
          transaktioner: data.transaktioner,
          [år]: data.belopp,
        });
      } else {
        const existingKonto = kontoMap.get(kontonummer);
        if (existingKonto) {
          existingKonto[år] = ((existingKonto[år] as number) || 0) + data.belopp;
        }
      }
    }
  }

  // Välj maximalt 2 år, senaste först
  const years = Array.from(årsSet)
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 2);

  const formatData = (map: Map<string, Map<string, ResultatKonto>>): KontoRad[] =>
    Array.from(map.entries()).map(([namn, kontoMap]) => {
      const konton = Array.from(kontoMap.values());
      const summering: { [år: string]: number } = {};
      for (const konto of konton) {
        for (const år of years) {
          const kontoValue = konto[år] as number;
          summering[år] = (summering[år] || 0) + (kontoValue || 0);
        }
      }
      return { namn, konton, summering };
    });

  return {
    ar: years,
    intakter: formatData(intakterMap),
    rorelsensKostnader: formatData(rorelsensMap),
    finansiellaIntakter: formatData(finansiellaIntakterMap),
    finansiellaKostnader: formatData(finansiellaKostnaderMap),
  };
}

/**
 * Hjälpfunktion för att filtrera transaktioner baserat på period
 */
function filterByPeriod(
  transaktioner: TransaktionsPost[],
  year?: string,
  period?: string
): TransaktionsPost[] {
  if (!year) {
    // Ingen filtrering - returnera senaste 2 åren (legacy behavior)
    const currentYear = new Date().getFullYear();
    return transaktioner.filter((t) => {
      const tYear = new Date(t.transaktionsdatum).getFullYear();
      return tYear === currentYear || tYear === currentYear - 1;
    });
  }

  const targetYear = parseInt(year);

  if (!period || period === "all") {
    // Helt år
    return transaktioner.filter((t) => {
      const tYear = new Date(t.transaktionsdatum).getFullYear();
      return tYear === targetYear;
    });
  }

  // Hantera kvartal (Q1, Q2, Q3, Q4)
  if (period.startsWith("Q")) {
    const quarter = parseInt(period.substring(1));
    const startMonth = (quarter - 1) * 3 + 1;
    const endMonth = startMonth + 2;

    return transaktioner.filter((t) => {
      const datum = new Date(t.transaktionsdatum);
      const tYear = datum.getFullYear();
      const tMonth = datum.getMonth() + 1;
      return tYear === targetYear && tMonth >= startMonth && tMonth <= endMonth;
    });
  }

  // Hantera månad (M01, M02, etc.)
  if (period.startsWith("M")) {
    const month = parseInt(period.substring(1));

    return transaktioner.filter((t) => {
      const datum = new Date(t.transaktionsdatum);
      const tYear = datum.getFullYear();
      const tMonth = datum.getMonth() + 1;
      return tYear === targetYear && tMonth === month;
    });
  }

  // Fallback: returnera allt för året
  return transaktioner.filter((t) => {
    const tYear = new Date(t.transaktionsdatum).getFullYear();
    return tYear === targetYear;
  });
}

/**
 * Hjälpfunktion för att extrahera kontoklass från kontonummer
 */
function getKontoklass(kontonummer: string): string {
  const first = kontonummer.charAt(0);
  const klassMap: { [key: string]: string } = {
    "1": "Tillgångar",
    "2": "Skulder och eget kapital",
    "3": "Intäkter",
    "4": "Kostnader för material och varor",
    "5": "Övriga externa kostnader",
    "6": "Personalkostnader",
    "7": "Avskrivningar och nedskrivningar",
    "8": "Finansiella poster",
  };
  return klassMap[first] || "Okänd";
}

/**
 * Hjälpfunktion för att extrahera kategori från kontonummer
 * Detta är en förenkling - i verkligheten bör kategorier komma från databasen
 */
function getKategori(kontonummer: string): string {
  if (/^30/.test(kontonummer)) return "Försäljning";
  if (/^31/.test(kontonummer)) return "Produktionsintäkter";
  if (/^39/.test(kontonummer)) return "Aktiverat arbete";

  if (/^40/.test(kontonummer)) return "Inköp av material och varor";
  if (/^41/.test(kontonummer)) return "Förändring av lager";

  if (/^50/.test(kontonummer)) return "Lokalkostnader";
  if (/^51/.test(kontonummer)) return "Fastighetskostnader";
  if (/^52/.test(kontonummer)) return "Hyra av anläggningstillgångar";
  if (/^53/.test(kontonummer)) return "Energikostnader";
  if (/^54/.test(kontonummer)) return "Förbrukningsinventarier";
  if (/^55/.test(kontonummer)) return "Reparation och underhåll";
  if (/^56/.test(kontonummer)) return "Kostnader för transportmedel";
  if (/^57/.test(kontonummer)) return "Frakt och transport";
  if (/^58/.test(kontonummer)) return "Resekostnader";
  if (/^59/.test(kontonummer)) return "Reklam och PR";

  if (/^60/.test(kontonummer)) return "Övriga försäljningskostnader";
  if (/^61/.test(kontonummer)) return "Kontorsmaterial och trycksaker";
  if (/^62/.test(kontonummer)) return "Tele och post";
  if (/^63/.test(kontonummer)) return "Företagsförsäkringar";
  if (/^64/.test(kontonummer)) return "Förvaltningskostnader";
  if (/^65/.test(kontonummer)) return "Övriga externa tjänster";
  if (/^66/.test(kontonummer)) return "Övriga externa kostnader";

  if (/^70/.test(kontonummer)) return "Löner";
  if (/^71/.test(kontonummer)) return "Kollektiva avgifter";
  if (/^72/.test(kontonummer)) return "Pensionskostnader";
  if (/^73/.test(kontonummer)) return "Övriga personalkostnader";

  if (/^74/.test(kontonummer)) return "Nedskrivningar";
  if (/^75/.test(kontonummer)) return "Avskrivningar";
  if (/^76/.test(kontonummer)) return "Nedskrivningar";
  if (/^77/.test(kontonummer)) return "Förlust vid försäljning";
  if (/^78/.test(kontonummer)) return "Vinst vid försäljning";

  if (/^80/.test(kontonummer)) return "Resultat från andelar";
  if (/^81/.test(kontonummer)) return "Ränteintäkter";
  if (/^82/.test(kontonummer)) return "Övriga finansiella intäkter";
  if (/^83/.test(kontonummer)) return "Valutakursvinster";
  if (/^84/.test(kontonummer)) return "Räntekostnader";
  if (/^85/.test(kontonummer)) return "Övriga finansiella kostnader";
  if (/^86/.test(kontonummer)) return "Valutakursförluster";
  if (/^87/.test(kontonummer)) return "Nedskrivningar";
  if (/^88/.test(kontonummer)) return "Resultat från andelar";
  if (/^89/.test(kontonummer)) return "Övriga finansiella kostnader";

  return "Övrigt";
}
