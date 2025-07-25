import { RAD_KONFIGURATIONER } from "./Extrarader/extraradDefinitioner";
import { SKATTETABELL_34_1_2025 } from "../skattetabell34";

// Om semestertillägg – kortfattat:

// Vad: Ett extra tillägg (minst 0,43 % av månadslönen per semesterdag) som betalas ut när anställda tar semester.
// Skatt: Semestertillägg är skattepliktigt och ska beskattas som vanlig lön.
// Syfte: Ger extra pengar under semestern utöver ordinarie lön.

// Så funkar det i koden:
// I extrarad-konfigurationen har semestertillägg läggTillIBruttolön: true.
// Vid löneberäkning summeras alla extrarader med denna flagga direkt till bruttolönen.
// Skatt och sociala avgifter beräknas på bruttolönen inklusive semestertillägg.
// Ingen hårdkodning – det styrs helt av flaggan i konfigurationen.

//#region Huvud

export interface LöneBeräkning {
  grundlön: number;
  tillägg: number;
  avdrag: number;
  bruttolön: number;
  socialaAvgifter: number;
  skatt: number;
  nettolön: number;
  totalLönekostnad: number;
}

export interface LöneKontrakt {
  månadslön: number;
  arbetstimmarPerVecka: number;
  skattetabell: string;
  skattekolumn: number;
  kommunalSkatt: number;
  socialaAvgifterSats: number;
}

export interface DagAvdrag {
  föräldraledighet: number;
  vårdAvSjuktBarn: number;
  sjukfrånvaro: number;
}

export type BilTyp = "bensinDiesel" | "el";

export interface Extrarad {
  kolumn1: string; // Benämning
  kolumn2: string; // Antal
  kolumn3: string; // Belopp
  kolumn4?: string; // Kommentar
}
//#endregion

// =====================================================================================
// 🔢 KONSTANTER OCH SATSER
// =====================================================================================

/**
 * Bokios officiella konstanter
 */
export const BOKIO_KONSTANTER = {
  DAGLÖN_PROCENT: 0.046,
  SJUKLÖN_PROCENT: 0.8,
  KARENSAVDRAG_PROCENT: 0.2,
  SEMESTERLÖN_PROCENT: 0.0043,
  SEMESTERERSÄTTNING_PROCENT: 0.12,
  VECKOR_PER_ÅR: 52,
  MÅNADER_PER_ÅR: 12,
  STANDARD_ARBETSTIMMAR_PER_VECKA: 40,
  // Semesterkonstanter
  SEMESTERDAGAR_PER_ÅR: 25,
  ARBETSDAGAR_PER_MÅNAD: 21.75, // Genomsnitt
} as const;

/**
 * Skattetabeller från actions.ts + Formler-mappen konsoliderade
 */
const SKATTESATSER: { [key: number]: number } = {
  29: 0.18,
  30: 0.2,
  31: 0.21974,
  32: 0.24,
  33: 0.26,
  34: 0.21974,
  35: 0.3,
  36: 0.32,
  37: 0.34,
  38: 0.36,
  39: 0.38,
  40: 0.4,
  41: 0.42,
  42: 0.44,
};

/**
 * Skattetabeller för olika inkomstnivåer (från konstanter.ts)
 */
export const SKATTETABELLER = {
  hög: { min: 35000, sats: 0.21974 },
  medel: { min: 31500, sats: 0.215 },
  låg: { min: 30000, sats: 0.205 },
  grund: { min: 0, sats: 0.19 },
} as const;

/**
 * Sociala avgifter konstant
 */
const SOCIAL_AVGIFT_SATS = 0.3142; // 31.42%

/**
 * Bilersättning per km
 */
export const BILERSÄTTNING_SATSER = {
  bensinDiesel: 2.85, // kr per km
  el: 1.2, // kr per km
} as const;

/**
 * Lista över skattepliktiga förmåner och tillägg
 */
const SKATTEPLIKTIGA_POSTER = [
  "försäkring",
  "boende",
  "gratis frukost",
  "gratis lunch eller middag",
  "gratis mat",
  "parkering",
  "företagsbil",
  "annan förmån",
  "ränteförmån",
  "lön",
  "övertid",
  "ob-tillägg",
  "risktillägg",
  "semestertillägg",
] as const;

// =====================================================================================
// 🧮 GRUNDLÄGGANDE BERÄKNINGAR
// =====================================================================================

/**
 * Beräknar daglön enligt Bokios formel
 * Bokio: 1 dag = 4,6% av månadslön
 */
export function beräknaDaglön(månadslön: number): number {
  return månadslön / 21.75;
}

/**
 * Beräknar timlön enligt Bokios formel
 * Bokio: månadslön × 12 / (52 × arbetstimmar per vecka)
 */
export function beräknaTimlön(månadslön: number, arbetstimmarPerVecka: number = 40): number {
  return (
    (månadslön * BOKIO_KONSTANTER.MÅNADER_PER_ÅR) /
    (BOKIO_KONSTANTER.VECKOR_PER_ÅR * arbetstimmarPerVecka)
  );
}

/**
 * Beräknar veckolön enligt Bokios formel
 * Bokio: årslön / 52 veckor
 */
export function beräknaVeckolön(månadslön: number): number {
  return (månadslön * BOKIO_KONSTANTER.MÅNADER_PER_ÅR) / BOKIO_KONSTANTER.VECKOR_PER_ÅR;
}

/**
 * Beräknar karensavdrag enligt Bokios formel
 * Bokio: 20% av veckosjuklön (som är 80% av veckolön)
 */
export function beräknaKarensavdrag(månadslön: number): number {
  const veckolön = beräknaVeckolön(månadslön);
  const veckosjuklön = veckolön * BOKIO_KONSTANTER.SJUKLÖN_PROCENT;
  return veckosjuklön * BOKIO_KONSTANTER.KARENSAVDRAG_PROCENT;
}

/**
 * Beräknar semesterlön enligt Bokios formel
 * Bokio: 0,43% av månadslön per dag
 */
export function beräknaSemesterLön(månadslön: number, dagar: number): number {
  return månadslön * BOKIO_KONSTANTER.SEMESTERLÖN_PROCENT * dagar;
}

/**
 * Beräknar semesterersättning enligt Bokios formel
 * Bokio: 12% av semesterlön
 */
export function beräknaSemesterersättning(semesterlön: number): number {
  return semesterlön * BOKIO_KONSTANTER.SEMESTERERSÄTTNING_PROCENT;
}

/**
 * Beräknar semesterlön per dag enligt procentregeln (Verksamt)
 * 12% av årslön för 25 dagar = 0,48% av årslön per dag
 * För månadslön: årslön = månadslön × 12
 */
export function beräknaSemesterlönPerDag(månadslön: number): number {
  const årslön = månadslön * 12;
  return årslön * 0.0048; // 0,48% av årslönen per semesterdag
}

/**
 * Beräknar bilersättning enligt Bokios formel
 * Bokio: Olika satser för olika biltyper
 */
export function beräknaBilersättning(bilTyp: BilTyp, kilometer: number): number {
  return kilometer * BILERSÄTTNING_SATSER[bilTyp];
}

/**
 * Beräknar semesterpenning för ett uttag
 */
export function beräknaSemesterpenning(
  månadslön: number,
  dagar: number
): {
  semesterlön: number;
  semesterersättning: number;
  totalt: number;
} {
  const semesterlön = månadslön * 0.0043 * dagar;
  const semesterersättning = semesterlön * 0.12;
  return {
    semesterlön,
    semesterersättning,
    totalt: semesterlön + semesterersättning,
  };
}

/**
 * Alias-funktioner för bakåtkompatibilitet
 */
export function beräknaObetaldDag(månadslön: number): number {
  return beräknaDaglön(månadslön);
}

export function beräknaSjukavdrag(månadslön: number): number {
  return beräknaDaglön(månadslön);
}

export function beräknaFöräldraledighetavdrag(månadslön: number): number {
  return beräknaDaglön(månadslön);
}

export function beräknaVårdavdrag(månadslön: number): number {
  return beräknaDaglön(månadslön);
}

// =====================================================================================
// � NYTT: KLASSIFICERA EXTRARADER FLEXIBELT
// =====================================================================================

/**
 * Klassificerar extrarader enligt konfigurationens flaggor.
 * Summerar till rätt kategori för loneberokningarna.
 */
export function klassificeraExtrarader(extrarader: any[]) {
  let bruttolönTillägg = 0;
  let skattepliktigaFörmåner = 0;
  let skattefriaErsättningar = 0;
  let övrigaTillägg = 0;
  let nettolönejustering = 0;

  extrarader.forEach((rad) => {
    const konfig = RAD_KONFIGURATIONER[rad.typ];
    const belopp = parseFloat(rad.kolumn3) || 0;

    if (konfig?.läggTillINettolön) {
      nettolönejustering += belopp;
    } else if (konfig?.läggTillIBruttolön) {
      bruttolönTillägg += belopp;
    } else if (konfig?.skattepliktig === true) {
      skattepliktigaFörmåner += belopp;
    } else if (konfig?.skattepliktig === false) {
      skattefriaErsättningar += belopp;
    } else {
      övrigaTillägg += belopp;
    }
  });

  return {
    bruttolönTillägg,
    skattepliktigaFörmåner,
    skattefriaErsättningar,
    övrigaTillägg,
    // nettolönejustering,
  };
}

// =====================================================================================
// �💰 LÖNEKONVERTERING (från actions.ts)
// =====================================================================================

/**
 * Konverterar olika lönetyper till månadslön
 * Flyttad från actions.ts rad 834-877
 */
export function konverteraLön(
  kompensation: number,
  ersättningPer: string,
  arbetsveckaTimmar: number = 40,
  deltidProcent?: number
): number {
  let grundlön = 0;

  switch (ersättningPer) {
    case "Månad":
      grundlön = kompensation;
      break;
    case "År":
      grundlön = kompensation / 12;
      break;
    case "Timme":
      grundlön = (kompensation * arbetsveckaTimmar * 52) / 12;
      break;
    case "Vecka":
      grundlön = (kompensation * 52) / 12;
      break;
    case "Dag":
      grundlön = kompensation * 21.7; // Genomsnitt arbetsdagar per månad
      break;
    default:
      grundlön = kompensation;
  }

  // Justera för deltid
  if (deltidProcent && deltidProcent < 100) {
    grundlön = grundlön * (deltidProcent / 100);
  }

  return Math.round(grundlön);
}

// =====================================================================================
// 🏦 AVGIFTER OCH SKATTER
// =====================================================================================
// commit.....
/**
 * Beräknar sociala avgifter
 */
export function beräknaSocialaAvgifter(
  bruttolön: number,
  sats: number = SOCIAL_AVGIFT_SATS
): number {
  return Math.round(bruttolön * sats);
}

/**
 * Beräknar total lönekostnad
 */
export function beräknaLönekostnad(bruttolön: number, socialaAvgifter: number): number {
  return bruttolön + socialaAvgifter;
}

/**
 * Identifierar om en post är skattepliktig
 */
export function ärSkattepliktig(benämning: string): boolean {
  return SKATTEPLIKTIGA_POSTER.some((typ) => benämning.toLowerCase().includes(typ.toLowerCase()));
}

/**
 * Beräknar skatt baserat på skattunderlag (från skatteberäkning.ts)
 */
export function beräknaSkatt(skattunderlag: number): number {
  let skattesats: number;

  if (skattunderlag >= SKATTETABELLER.hög.min) {
    skattesats = SKATTETABELLER.hög.sats;
  } else if (skattunderlag >= SKATTETABELLER.medel.min) {
    skattesats = SKATTETABELLER.medel.sats;
  } else if (skattunderlag >= SKATTETABELLER.låg.min) {
    skattesats = SKATTETABELLER.låg.sats;
  } else {
    skattesats = SKATTETABELLER.grund.sats;
  }

  return Math.round(skattunderlag * skattesats);
}

/**
 * Beräknar skatt med skattetabell (från actions.ts)
 */
export function beräknaSkattMedTabell(bruttolön: number, skattetabell?: number): number {
  const tabell = skattetabell || 34;
  const skattesats = SKATTESATSER[tabell] || 0.21974;
  return Math.round(bruttolön * skattesats);
}

/**
 * Beräknar skattunderlag med alla skattepliktiga tillägg
 */
export function beräknaSkattunderlag(grundlön: number, extrarader: any[]): number {
  let skattunderlag = grundlön;
  extrarader.forEach((rad) => {
    if (RAD_KONFIGURATIONER[rad.typ]?.skattepliktig) {
      skattunderlag += parseFloat(rad.kolumn3) || 0;
    }
  });
  return skattunderlag;
}

// =====================================================================================
// 🎯 HUVUDBERÄKNINGAR - KOMPLETT LÖNEBERÄKNING
// =====================================================================================

/**
 * Komplett löneberäkning med extrarader (från huvudberäkningar.ts)
 * För avancerade beräkningar med övertid och dagavdrag
 */
export function beräknaKomplett(
  kontrakt: LöneKontrakt,
  övertidTimmar: number = 0,
  dagAvdrag: DagAvdrag = { föräldraledighet: 0, vårdAvSjuktBarn: 0, sjukfrånvaro: 0 },
  extrarader: any[] = []
) {
  const timlön = beräknaTimlön(kontrakt.månadslön, kontrakt.arbetstimmarPerVecka);
  const daglön = beräknaDaglön(kontrakt.månadslön);
  const övertidsersättning = övertidTimmar * timlön * 1.5;
  const totalDagavdrag =
    (dagAvdrag.föräldraledighet + dagAvdrag.vårdAvSjuktBarn + dagAvdrag.sjukfrånvaro) * daglön;

  const {
    bruttolönTillägg,
    skattepliktigaFörmåner,
    skattefriaErsättningar,
    övrigaTillägg,
    // nettolönejustering,
  } = klassificeraExtrarader(extrarader);

  // I Bokio ingår skattepliktiga förmåner direkt i bruttolönen
  const bruttolön =
    kontrakt.månadslön +
    övertidsersättning +
    övrigaTillägg +
    bruttolönTillägg +
    skattepliktigaFörmåner -
    totalDagavdrag;

  const skattunderlag = bruttolön; // Skattepliktiga förmåner redan inkluderade i bruttolön
  const skatt = beräknaSkattTabell34(skattunderlag);

  // Nettolön beräknas på kontantlön (grundlön + tillägg - avdrag), inte på förmåner
  const kontantlön =
    kontrakt.månadslön + övertidsersättning + övrigaTillägg + bruttolönTillägg - totalDagavdrag;
  const nettolön = kontantlön - skatt + skattefriaErsättningar;
  //  + nettolönejustering;

  const socialaAvgifter = beräknaSocialaAvgifter(skattunderlag, kontrakt.socialaAvgifterSats);
  const lönekostnad = bruttolön + socialaAvgifter; // Skattepliktiga förmåner redan inkluderade i bruttolön

  return {
    timlön: Math.round(timlön * 100) / 100,
    daglön: Math.round(daglön),
    bruttolön,
    socialaAvgifter,
    lönekostnad,
    skatt,
    dagavdrag: {
      föräldraledighet: dagAvdrag.föräldraledighet * daglön,
      vårdAvSjuktBarn: dagAvdrag.vårdAvSjuktBarn * daglön,
      sjukfrånvaro: dagAvdrag.sjukfrånvaro * daglön,
      totalt: totalDagavdrag,
    },
    nettolön,
    skattunderlag,
    skattefriaErsättningar,
  };
}

/**
 * Huvudfunktion för lönekomponenter (från huvudberäkningar.ts)
 * För bakåtkompatibilitet med befintliga komponenter
 */
export function beräknaLonekomponenter(
  grundlön: number,
  övertid: number,
  lönespec: any,
  extrarader: any[]
) {
  const originalGrundlön = grundlön ?? lönespec?.grundlön ?? lönespec?.bruttolön ?? 35000;
  const originalÖvertid = övertid ?? lönespec?.övertid ?? 0;

  // Skapa kontrakt
  const kontrakt: LöneKontrakt = {
    månadslön: originalGrundlön,
    arbetstimmarPerVecka: 40,
    skattetabell: "34",
    skattekolumn: 1,
    kommunalSkatt: 32,
    socialaAvgifterSats: 0.3142,
  };

  // Analysera extrarader
  const dagAvdrag: DagAvdrag = {
    föräldraledighet: 0,
    vårdAvSjuktBarn: 0,
    sjukfrånvaro: 0,
  };

  let karensavdragSumma = 0;
  const övrigaExtrarader: any[] = [];

  extrarader.forEach((rad) => {
    const antal = parseFloat(rad.kolumn2) || 1;

    if (rad.kolumn1?.toLowerCase().includes("karensavdrag")) {
      // Hantera karensavdrag enligt Bokio
      karensavdragSumma += beräknaKarensavdrag(originalGrundlön) * antal;
    } else if (rad.kolumn1?.toLowerCase().includes("föräldraledighet")) {
      dagAvdrag.föräldraledighet = antal;
    } else if (rad.kolumn1?.toLowerCase().includes("vård av sjukt barn")) {
      dagAvdrag.vårdAvSjuktBarn = antal;
    } else if (rad.kolumn1?.toLowerCase().includes("sjuk")) {
      dagAvdrag.sjukfrånvaro = antal;
    } else {
      övrigaExtrarader.push(rad);
    }
  });

  // Om karensavdrag finns, lägg till det som dagavdrag (så det bara dras en gång)
  let justeradeDagAvdrag = { ...dagAvdrag };
  if (karensavdragSumma > 0) {
    // Vi lägger karensavdraget som "sjukfrånvaro" (eller egen property om du vill)
    justeradeDagAvdrag.sjukfrånvaro += karensavdragSumma / beräknaDaglön(originalGrundlön);
  }

  // Beräkna övertidstimmar
  const övertidTimmar = originalÖvertid > 0 ? originalÖvertid / (originalGrundlön * 0.01) : 0;

  // Använd huvudberäkning
  const beräkningar = beräknaKomplett(
    kontrakt,
    övertidTimmar,
    justeradeDagAvdrag,
    övrigaExtrarader
  );

  return {
    grundlön: originalGrundlön,
    övertid: originalÖvertid,
    extraradsSumma: övrigaExtrarader.reduce((sum, rad) => sum + (parseFloat(rad.kolumn3) || 0), 0),
    bruttolön: beräkningar.bruttolön,
    socialaAvgifter: beräkningar.socialaAvgifter,
    skatt: beräkningar.skatt,
    nettolön: beräkningar.nettolön,
    lönekostnad: beräkningar.lönekostnad,
    timlön: beräkningar.timlön,
    daglön: beräkningar.daglön,
    dagavdrag: beräkningar.dagavdrag,
    skattunderlag: beräkningar.skattunderlag,
  };
}

export function beräknaSkattTabell34(bruttolön: number): number {
  const entry = SKATTETABELL_34_1_2025.find((row) => bruttolön >= row.from && bruttolön <= row.to);
  if (entry) {
    return entry.skatt;
  }
  console.log("Ingen rad hittad för bruttolön:", bruttolön);
  return 0;
}

// =====================================================================================
// 🏖️ SEMESTERBERÄKNINGAR
// =====================================================================================

/**
 * Beräknar automatisk semesterintjäning per månad
 * Bokio: 25 dagar per år = 2,083 dagar per månad
 */
export function beräknaSemesterIntjäningPerMånad(tjänstegrad: number = 100): number {
  const dagarPerMånad = BOKIO_KONSTANTER.SEMESTERDAGAR_PER_ÅR / BOKIO_KONSTANTER.MÅNADER_PER_ÅR;
  return Math.round(dagarPerMånad * (tjänstegrad / 100) * 100) / 100; // Avrunda till 2 decimaler
}

/**
 * Beräknar total semesterlön (grundlön + tillägg)
 */
export function beräknaTotalSemesterlön(
  månadslön: number,
  semesterdagar: number
): {
  semesterlön: number;
  semesterersättning: number;
  totalt: number;
} {
  const semesterlön = beräknaSemesterLön(månadslön, semesterdagar);
  const semesterersättning = beräknaSemesterersättning(semesterlön);

  return {
    semesterlön,
    semesterersättning,
    totalt: semesterlön + semesterersättning,
  };
}

/**
 * Semestertyper som ska kopplas automatiskt till semestersystemet
 */
export const SEMESTER_EXTRARAD_TYPER = [
  "semestertillägg",
  "semesterlön",
  " ter",
  "betaldSemester", // Från extraradDefinitioner
  "semester",
  "semesterersättning",
] as const;

/**
 * Identifierar om en extrarad är semesterrelaterad
 */
export function ärSemesterExtrarad(typ: string, kolumn1: string): boolean {
  const typLower = (typ || "").toLowerCase();
  const kolumn1Lower = (kolumn1 || "").toLowerCase();

  return SEMESTER_EXTRARAD_TYPER.some(
    (semesterTyp) => typLower.includes(semesterTyp) || kolumn1Lower.includes(semesterTyp)
  );
}

/**
 * Extraherar antal semesterdagar från extrarad
 */
export function extraheraAntalSemesterdagar(kolumn2: string, kolumn3: string): number {
  // Försök först kolumn2 (antal)
  const antal = parseFloat(kolumn2 || "0");
  if (antal > 0) return antal;

  // Om kolumn2 är tom, försök hitta dagar i kolumn3 (belopp)
  const match = (kolumn3 || "").match(/(\d+(?:\.\d+)?)\s*dag/i);
  if (match) return parseFloat(match[1]);

  return 0;
}

/**
 * Beräknar semesterintjäning mellan två datum
 */
export function beräknaSemesterIntjäningMellanDatum(
  startDatum: Date,
  slutDatum: Date,
  tjänstegrad: number = 100
): number {
  const månaderSkillnad =
    (slutDatum.getFullYear() - startDatum.getFullYear()) * 12 +
    (slutDatum.getMonth() - startDatum.getMonth());

  const månadslönIntjäning = beräknaSemesterIntjäningPerMånad(tjänstegrad);
  return Math.max(0, månaderSkillnad * månadslönIntjäning);
}

/**
 * Beräknar real-time semesterintjäning för nuvarande månad
 * Används för att visa aktuellt saldo utan att spara i databas
 */
export function beräknaAktuelMånadsIntjäning(tjänstegrad: number = 100): number {
  const idag = new Date();

  // Dagar sedan månadsbörjan (1 juli = 0 dagar, 7 juli = 6 dagar)
  const dagarIMånaden = idag.getDate() - 1;

  // Intjäning per dag baserat på 25 dagar per år
  const intjäningPerDag = (BOKIO_KONSTANTER.SEMESTERDAGAR_PER_ÅR / 365) * (tjänstegrad / 100);

  // Total intjäning för dagarna i denna månad
  const månadensIntjäning = dagarIMånaden * intjäningPerDag;

  return Math.round(månadensIntjäning * 100) / 100; // Avrunda till 2 decimaler
}

/**
 * Beräknar totalt semestersaldo med real-time för nuvarande månad
 * Kombinerar sparad data från databas med aktuell månads intjäning
 */
export function beräknaTotaltSemesterSaldo(
  sparadData: {
    intjänat: number;
    betalda: number;
    sparade: number;
    obetald: number;
    förskott: number;
    ersättning: number;
    kvarvarande: number;
    tillgängligt: number;
  },
  tjänstegrad: number = 100
) {
  // Lägg till aktuell månads intjäning till sparad intjäning
  const aktuelMånadsIntjäning = beräknaAktuelMånadsIntjäning(tjänstegrad);
  const totaltIntjänat = sparadData.intjänat + aktuelMånadsIntjäning;

  // Debug: Visa vad som kommer från databasen
  console.log("🔍 Semester debug - sparadData:", {
    intjänat: sparadData.intjänat,
    betalda: sparadData.betalda,
    sparade: sparadData.sparade,
    obetald: sparadData.obetald,
    förskott: sparadData.förskott,
    ersättning: sparadData.ersättning,
  });

  // Sparade dagar ska visas under Betalda, inte som separat kategori
  const totaltBetalda = sparadData.betalda + sparadData.sparade;

  console.log("🔍 Semester debug - beräkning:", {
    "sparadData.betalda": sparadData.betalda,
    "sparadData.sparade": sparadData.sparade,
    "totaltBetalda (betalda + sparade)": totaltBetalda,
    aktuelMånadsIntjäning: aktuelMånadsIntjäning,
    totaltIntjänat: totaltIntjänat,
  });

  // Beräkna om kvarvarande och tillgängligt med uppdaterad logik
  const kvarvarande = totaltIntjänat - totaltBetalda;
  const tillgängligt = kvarvarande; // Ingen separat sparade längre

  return {
    intjänat: totaltIntjänat,
    betalda: totaltBetalda, // Inkluderar nu sparade dagar
    sparade: 0, // Visas inte längre som separat kategori
    obetald: sparadData.obetald,
    förskott: sparadData.förskott,
    ersättning: sparadData.ersättning,
    kvarvarande,
    tillgängligt,
    aktuelMånadsIntjäning, // Extra info för debugging
  };
}

/**
 * Beräknar total semesterintjäning sedan anställningsdatum
 * Använder formeln: (dagar sedan anställning / 365) * 25 * tjänstegrad
 */
export function beräknaTotalIntjäningSedanAnställning(anställd: any): number {
  const idag = new Date();
  const anställningsdatum = new Date(anställd.startdatum);

  // Beräkna dagar sedan anställning
  const dagarSedanAnställning = Math.floor(
    (idag.getTime() - anställningsdatum.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Beräkna intjänade dagar: (dagar / 365) * 25 semesterdagar per år
  const tjänstegrad = (anställd.deltid_procent || 100) / 100;
  const intjänadeDagar = (dagarSedanAnställning / 365) * 25 * tjänstegrad;

  return Math.max(0, parseFloat(intjänadeDagar.toFixed(2)));
}

/**
 * Beräknar aktuell månads semesterintjäning
 * Använder formeln: (25 dagar / 12 månader) * tjänstegrad
 */
// export function beräknaAktuelMånadsIntjäning(tjänstegrad: number = 100): number {
//  const månatligIntjäning = (25 / 12) * (tjänstegrad / 100);
//  return parseFloat(månatligIntjäning.toFixed(2));
// }
