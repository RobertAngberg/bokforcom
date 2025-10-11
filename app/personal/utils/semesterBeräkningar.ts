/**
 * Automatisk semesterintjäning och beräkningar
 * Baserat på svenska semesterlagen och Bokios logik
 *
 * SEMESTERLÖNEBERÄKNING:
 * - Sammalöneregeln (månadslönade): månadslön × 0.43% (0.0043) per dag
 * - Procentregeln (timanställda): total lön × 12% / 25 dagar
 * - Semesterersättning: 12% av semesterlön
 */

import { BOKIO_KONSTANTER } from "./loneberakningar";

// Exportera semesterkonstanter för återanvändning
export const SEMESTER_KONSTANTER = {
  /** Sammalöneregeln: 0.43% av månadslön per dag */
  SEMESTERLÖN_PROCENT_PER_DAG: BOKIO_KONSTANTER.SEMESTERLÖN_PROCENT, // 0.0043

  /** Semesterersättning: 12% av semesterlön */
  SEMESTERERSÄTTNING_PROCENT: BOKIO_KONSTANTER.SEMESTERERSÄTTNING_PROCENT, // 0.12

  /** Lagstadgad semester: 25 dagar per år */
  LAGSTADGADE_SEMESTERDAGAR: 25,

  /** Procentregeln: 12% av total lön för timanställda */
  PROCENTREGELN_PROCENT: 0.12,
} as const;

export interface SemesterIntjäning {
  intjänandeår: string; // "2024-2025"
  intjänadeDagar: number;
  intjänadPengaTillägg: number;
  återstående: number;
  uttagna: number;
}

export interface SemesterBeräkning {
  månadslön: number;
  anställningsdatum: Date;
  heltid: boolean;
  tjänstegrad: number; // 0-100%
}

/**
 * Beräknar intjänade semesterdagar per månad
 * Enligt lag: 25 dagar per år = 2,08 dagar per månad
 */
export function beräknaIntjänadeSemesterdagar(
  månadslön: number,
  anställningsdatum: Date,
  tjänstegrad: number = 100
): SemesterIntjäning[] {
  const DAGAR_PER_MÅNAD = 25 / 12; // 2,08 dagar per månad
  const startDatum = new Date(anställningsdatum);
  const idag = new Date();

  const intjäningsperioder: SemesterIntjäning[] = [];

  // Räkna från anställningsdatum till idag
  const aktuellMånad = new Date(startDatum.getFullYear(), startDatum.getMonth(), 1);

  while (aktuellMånad <= idag) {
    const intjänandeår = getIntjänandeÅr(aktuellMånad);
    const intjänadeDagar = DAGAR_PER_MÅNAD * (tjänstegrad / 100);
    const intjänadPengaTillägg = beräknaSemesterersättning(månadslön, intjänadeDagar);

    // Hitta eller skapa intjäningsperiod
    let period = intjäningsperioder.find((p) => p.intjänandeår === intjänandeår);
    if (!period) {
      period = {
        intjänandeår,
        intjänadeDagar: 0,
        intjänadPengaTillägg: 0,
        återstående: 0,
        uttagna: 0,
      };
      intjäningsperioder.push(period);
    }

    period.intjänadeDagar += intjänadeDagar;
    period.intjänadPengaTillägg += intjänadPengaTillägg;
    period.återstående = period.intjänadeDagar - period.uttagna;

    // Nästa månad
    aktuellMånad.setMonth(aktuellMånad.getMonth() + 1);
  }

  return intjäningsperioder;
}

/**
 * Returnerar intjänandeår (1 april - 31 mars)
 */
function getIntjänandeÅr(datum: Date): string {
  const år = datum.getFullYear();
  const månad = datum.getMonth(); // 0-11

  if (månad >= 3) {
    // April-December
    return `${år}-${år + 1}`;
  } else {
    // Januari-Mars
    return `${år - 1}-${år}`;
  }
}

/**
 * Beräknar semesterersättning (12% av semesterlön)
 * Intern hjälpfunktion
 */
function beräknaSemesterersättning(månadslön: number, dagar: number): number {
  const semesterlön = månadslön * SEMESTER_KONSTANTER.SEMESTERLÖN_PROCENT_PER_DAG * dagar;
  return semesterlön * SEMESTER_KONSTANTER.SEMESTERERSÄTTNING_PROCENT;
}

/**
 * Beräknar semesterpenning vid uttag enligt sammalöneregeln
 *
 * Sammalöneregeln (för månadslönade):
 * - Semesterlön: månadslön × 0.43% (0.0043) × antal dagar
 * - Semesterersättning: 12% av semesterlön
 *
 * @param månadslön - Anställds månadslön i SEK
 * @param dagar - Antal semesterdagar att ta ut
 * @param inkluderaSemesterersättning - Om 12% tillägg ska inkluderas (default: true)
 *
 * @example
 * // Exempel: 35,000 kr/månad, 5 dagar
 * beräknaSemesterpenning(35000, 5, true)
 * // => { semesterlön: 752.50, semesterersättning: 90.30, totaltBelopp: 842.80 }
 */
export function beräknaSemesterpenning(
  månadslön: number,
  dagar: number,
  inkluderaSemesterersättning: boolean = true
): {
  semesterlön: number;
  semesterersättning: number;
  totaltBelopp: number;
} {
  // Sammalöneregeln: månadslön × 0.0043 × antal dagar
  const semesterlön = månadslön * SEMESTER_KONSTANTER.SEMESTERLÖN_PROCENT_PER_DAG * dagar;

  // Semesterersättning: 12% av semesterlön
  const semesterersättning = inkluderaSemesterersättning
    ? semesterlön * SEMESTER_KONSTANTER.SEMESTERERSÄTTNING_PROCENT
    : 0;

  return {
    semesterlön,
    semesterersättning,
    totaltBelopp: semesterlön + semesterersättning,
  };
}

/**
 * Beräknar semesterskuld vid uppsägning
 * Använder sammalöneregeln för att beräkna vad som ska utbetalas
 */
export function beräknaSemesterskuld(
  månadslön: number,
  outtagenSemester: number,
  intjänadSemester: number
): number {
  const kvarstående = Math.max(0, intjänadSemester - outtagenSemester);
  return beräknaSemesterpenning(månadslön, kvarstående, true).totaltBelopp;
}

/**
 * Beräknar semesterlön enligt procentregeln (för timanställda)
 *
 * Procentregeln:
 * - Total semesterlön: totalt intjänad lön × 12%
 * - Per dag: total semesterlön / 25 dagar
 *
 * @param totalIntjänadLön - Total lön under intjänandeåret
 * @param dagar - Antal semesterdagar (optional, för att få belopp för specifikt antal dagar)
 *
 * @example
 * // Total lön för året: 300,000 kr
 * beräknaSemesterProcentregeln(300000)
 * // => { totalSemesterlön: 36000, perDag: 1440, totaltBelopp: 36000 }
 *
 * @example
 * // Uttag av 5 dagar
 * beräknaSemesterProcentregeln(300000, 5)
 * // => { totalSemesterlön: 36000, perDag: 1440, totaltBelopp: 7200 }
 */
export function beräknaSemesterProcentregeln(
  totalIntjänadLön: number,
  dagar?: number
): {
  totalSemesterlön: number;
  perDag: number;
  totaltBelopp: number;
} {
  // Procentregeln: 12% av total intjänad lön
  const totalSemesterlön = totalIntjänadLön * SEMESTER_KONSTANTER.PROCENTREGELN_PROCENT;

  // Per dag: total semesterlön / 25 dagar
  const perDag = totalSemesterlön / SEMESTER_KONSTANTER.LAGSTADGADE_SEMESTERDAGAR;

  // Om specifikt antal dagar anges, beräkna för det
  const totaltBelopp = dagar ? perDag * dagar : totalSemesterlön;

  return {
    totalSemesterlön,
    perDag,
    totaltBelopp,
  };
}

/**
 * Validerar semesteruttag
 */
export function valideraSemesteruttag(
  begärdaDagar: number,
  tillgängligaDagar: number,
  sparadeDagar: number,
  förskottsTillåtet: boolean = false,
  maxFörskott: number = 25
): {
  godkänt: boolean;
  meddelande: string;
  förskottsDagar: number;
} {
  const totaltTillgängligt = tillgängligaDagar + sparadeDagar;

  if (begärdaDagar <= totaltTillgängligt) {
    return {
      godkänt: true,
      meddelande: "Semesteruttag godkänt",
      förskottsDagar: 0,
    };
  }

  const förskottsBehov = begärdaDagar - totaltTillgängligt;

  if (förskottsTillåtet && förskottsBehov <= maxFörskott) {
    return {
      godkänt: true,
      meddelande: `Semesteruttag godkänt med ${förskottsBehov} förskottsdagar`,
      förskottsDagar: förskottsBehov,
    };
  }

  return {
    godkänt: false,
    meddelande: `Otillräckligt med semesterdagar. Begärt: ${begärdaDagar}, Tillgängligt: ${totaltTillgängligt}`,
    förskottsDagar: 0,
  };
}

// Enkel util för att beräkna intjänade dagar per månad utifrån tjänstegrad
export function beräknaIntjänadeDagar(tjänstegrad: number = 100): number {
  const dagarPerMånad = SEMESTER_KONSTANTER.LAGSTADGADE_SEMESTERDAGAR / 12; // 25 / 12 = 2.08
  return dagarPerMånad * (tjänstegrad / 100);
}
