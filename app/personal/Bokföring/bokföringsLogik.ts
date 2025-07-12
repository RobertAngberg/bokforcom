import { KONTO_MAPPNINGAR, hittaBokföringsregel, type BokföringsRegel } from "./bokföringsRegler";
import {
  klassificeraExtrarader,
  beräknaSkattTabell34,
  beräknaSocialaAvgifter,
} from "../Lonespecar/loneberokningar";
import { RAD_KONFIGURATIONER } from "../Lonespecar/Extrarader/extraradDefinitioner";

export interface BokföringsRad {
  konto: string;
  kontoNamn: string;
  debet: number;
  kredit: number;
  beskrivning: string;
  anställdNamn?: string;
}

export interface BokföringsSummering {
  rader: BokföringsRad[];
  totalDebet: number;
  totalKredit: number;
  balanserar: boolean;
}

export function genereraBokföringsrader(
  lönespecar: Record<string, any>,
  anställda: any[]
): BokföringsSummering {
  const bokföringsrader: BokföringsRad[] = [];
  const anställdMap = new Map(anställda.map((a) => [a.id, a]));

  Object.entries(lönespecar).forEach(([anställdId, lönespec]) => {
    const anställd = anställdMap.get(parseInt(anställdId));
    const anställdNamn = anställd ? `${anställd.förnamn} ${anställd.efternamn}` : "Okänd";

    // Hämta procentsats för sociala avgifter
    const socialaAvgifterSats = Number(lönespec.socialaAvgifterSats || 0.3142);

    // Klassificera extrarader
    const klassificering = klassificeraExtrarader(lönespec.extrarader || []);
    const grundlön = Number(lönespec.beräknadeVärden?.grundlön || lönespec.grundlön || 0);
    const bruttolön =
      grundlön +
      klassificering.bruttolönTillägg -
      (klassificering.nettolönejustering < 0 ? Math.abs(klassificering.nettolönejustering) : 0);

    // --- Bokio-style: Beräkna bruttolön efter avdrag (VAB och föräldraledighet) ---
    let antalForaldraledighet = 0;
    let antalVab = 0;
    const foraldraledighetRad = (lönespec.extrarader || []).find(
      (rad: any) => rad.typ === "foraldraledighet"
    );
    if (foraldraledighetRad) {
      antalForaldraledighet = Number(foraldraledighetRad.kolumn2) || 1;
    }
    const vabRad = (lönespec.extrarader || []).find((rad: any) => rad.typ === "vab");
    if (vabRad) {
      antalVab = Number(vabRad.kolumn2) || 1;
    }
    // Summera alla tillägg med läggTillIBruttolön: true
    let tillaggBruttolon = 0;
    (lönespec.extrarader || []).forEach((rad: any) => {
      const konfig = rad.typ && RAD_KONFIGURATIONER[rad.typ];
      if (konfig && konfig.läggTillIBruttolön) {
        tillaggBruttolon += Number(rad.kolumn3) || 0;
      }
    });
    // Bruttolön = månadslön + tillägg - avdrag (VAB/föräldraledighet)
    const daglon = grundlön * 0.046;
    const totalAvdrag = daglon * (antalForaldraledighet + antalVab);
    const bruttolönKorr = grundlön + tillaggBruttolon - totalAvdrag;

    // Skatt och sociala avgifter på korrigerad bruttolön
    const skatt = beräknaSkattTabell34(bruttolönKorr);
    const socialaAvgifter = beräknaSocialaAvgifter(bruttolönKorr, socialaAvgifterSats);

    // Bokföringsrader
    if (bruttolönKorr > 0) {
      bokföringsrader.push({
        konto: KONTO_MAPPNINGAR.grundlön.debet!,
        kontoNamn: KONTO_MAPPNINGAR.grundlön.namn,
        debet: Math.round(bruttolönKorr * 100) / 100,
        kredit: 0,
        beskrivning: `Bruttolön inkl tillägg/avdrag - ${anställdNamn}`,
        anställdNamn,
      });
    }
    if (socialaAvgifter > 0) {
      const socialaAvgifterRounded = Math.round(socialaAvgifter * 100) / 100;
      bokföringsrader.push(
        {
          konto: KONTO_MAPPNINGAR.socialaAvgifter.debet!,
          kontoNamn: KONTO_MAPPNINGAR.socialaAvgifter.namn,
          debet: socialaAvgifterRounded,
          kredit: 0,
          beskrivning: `Lagstadgade sociala avgifter - ${anställdNamn}`,
          anställdNamn,
        },
        {
          konto: KONTO_MAPPNINGAR.socialaAvgifter.kredit!,
          kontoNamn: "Avräkning lagstadgade sociala avgifter",
          debet: 0,
          kredit: socialaAvgifterRounded,
          beskrivning: `Avräkning lagstadgade sociala avgifter - ${anställdNamn}`,
          anställdNamn,
        }
      );
    }
    if (skatt > 0) {
      bokföringsrader.push({
        konto: KONTO_MAPPNINGAR.preliminärSkatt.kredit!,
        kontoNamn: KONTO_MAPPNINGAR.preliminärSkatt.namn,
        debet: 0,
        kredit: Math.round(skatt * 100) / 100,
        beskrivning: `Preliminär skatt - ${anställdNamn}`,
        anställdNamn,
      });
    }
    // Nettolön = bruttolön - skatt
    const nettolön = bruttolönKorr - skatt;
    if (nettolön > 0) {
      bokföringsrader.push({
        konto: KONTO_MAPPNINGAR.nettolön.kredit!,
        kontoNamn: KONTO_MAPPNINGAR.nettolön.namn,
        debet: 0,
        kredit: Math.round(nettolön * 100) / 100,
        beskrivning: `Nettolön utbetalning - ${anställdNamn}`,
        anställdNamn,
      });
    }
    // --- Bokio-style: Bokför semesterlöneskuld och sociala avgifter för semester ---
    // Bokio: semesterlöneskuld = daglön * antal arbetsdagar per månad * 0.12
    const arbetsdagarPerMånad = 21.75; // Bokios standard
    const semesterlonRounded = Math.round(daglon * arbetsdagarPerMånad * 0.12 * 100) / 100;
    const socialaSemesterAvgifterRounded =
      Math.round(semesterlonRounded * socialaAvgifterSats * 100) / 100;
    bokföringsrader.push(
      {
        konto: "7290",
        kontoNamn: "Förändring av semesterlöneskuld",
        debet: semesterlonRounded,
        kredit: 0,
        beskrivning: `Förändring av semesterlöneskuld - ${anställdNamn}`,
        anställdNamn,
      },
      {
        konto: "2920",
        kontoNamn: "Upplupna semesterlöner",
        debet: 0,
        kredit: semesterlonRounded,
        beskrivning: `Upplupna semesterlöner - ${anställdNamn}`,
        anställdNamn,
      },
      {
        konto: "7519",
        kontoNamn: "Sociala avgifter för semester- och löneskulder",
        debet: socialaSemesterAvgifterRounded,
        kredit: 0,
        beskrivning: `Sociala avgifter för semesterlöneskuld - ${anställdNamn}`,
        anställdNamn,
      },
      {
        konto: "2940",
        kontoNamn: "Upplupna lagstadgade sociala och andra avgifter",
        debet: 0,
        kredit: socialaSemesterAvgifterRounded,
        beskrivning: `Upplupna lagstadgade sociala avgifter för semester - ${anställdNamn}`,
        anställdNamn,
      }
    );
  });

  const summeradeRader = summeraBokföringsrader(bokföringsrader);
  const totalDebet = summeradeRader.reduce((sum, rad) => sum + Number(rad.debet || 0), 0);
  const totalKredit = summeradeRader.reduce((sum, rad) => sum + Number(rad.kredit || 0), 0);

  return {
    rader: summeradeRader,
    totalDebet: Math.round(totalDebet * 100) / 100,
    totalKredit: Math.round(totalKredit * 100) / 100,
    balanserar: Math.abs(totalDebet - totalKredit) < 0.01,
  };
}

function summeraBokföringsrader(rader: BokföringsRad[]): BokföringsRad[] {
  const kontoMap = new Map<string, BokföringsRad>();

  rader.forEach((rad) => {
    const nyckel = `${rad.konto}-${rad.kontoNamn}`;
    if (kontoMap.has(nyckel)) {
      const befintlig = kontoMap.get(nyckel)!;
      befintlig.debet += Number(rad.debet || 0);
      befintlig.kredit += Number(rad.kredit || 0);
    } else {
      kontoMap.set(nyckel, {
        ...rad,
        debet: Number(rad.debet || 0),
        kredit: Number(rad.kredit || 0),
      });
    }
  });

  return Array.from(kontoMap.values()).sort((a, b) => a.konto.localeCompare(b.konto));
}
