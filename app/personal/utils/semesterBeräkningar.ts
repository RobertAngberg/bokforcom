/**
 * Automatisk semesterintjäning och beräkningar
 * Baserat på svenska semesterlagen och Bokios logik
 */

import { BOKIO_KONSTANTER } from "./loneberakningar";
import { beräknaSemesterpenning as beräknaSemesterpenningLöneberäkning } from "./loneberakningar";

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
  let aktuellMånad = new Date(startDatum.getFullYear(), startDatum.getMonth(), 1);

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
 */
function beräknaSemesterersättning(månadslön: number, dagar: number): number {
  const semesterlön = månadslön * BOKIO_KONSTANTER.SEMESTERLÖN_PROCENT * dagar;
  return semesterlön * BOKIO_KONSTANTER.SEMESTERERSÄTTNING_PROCENT;
}

/**
 * Beräknar semesterpenning vid uttag
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
  const semesterlön = månadslön * BOKIO_KONSTANTER.SEMESTERLÖN_PROCENT * dagar;
  const semesterersättning = inkluderaSemesterersättning
    ? semesterlön * BOKIO_KONSTANTER.SEMESTERERSÄTTNING_PROCENT
    : 0;

  return {
    semesterlön,
    semesterersättning,
    totaltBelopp: semesterlön + semesterersättning,
  };
}

/**
 * Beräknar semesterskuld vid uppsägning
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
  return (25 / 12) * (tjänstegrad / 100);
}
