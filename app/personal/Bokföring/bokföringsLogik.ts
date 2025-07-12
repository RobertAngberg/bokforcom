import { KONTO_MAPPNINGAR, hittaBokföringsregel, type BokföringsRegel } from "./bokföringsRegler";
import {
  klassificeraExtrarader,
  beräknaSkattTabell34,
  beräknaSocialaAvgifter,
} from "../Lonespecar/loneberokningar";

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

    // Klassificera extrarader
    const klassificering = klassificeraExtrarader(lönespec.extrarader || []);
    const grundlön = Number(lönespec.beräknadeVärden?.grundlön || lönespec.grundlön || 0);
    const bruttolön =
      grundlön +
      klassificering.bruttolönTillägg -
      (klassificering.nettolönejustering < 0 ? Math.abs(klassificering.nettolönejustering) : 0);

    // Skatt enligt Bokio (skattetabell 34, kolumn 1)
    const skatt = beräknaSkattTabell34(bruttolön);
    // Sociala avgifter enligt Bokio
    const socialaAvgifterSats = Number(lönespec.socialaAvgifterSats || 0.3142);
    const socialaAvgifter = beräknaSocialaAvgifter(bruttolön, socialaAvgifterSats);

    // Bokföringsrader
    if (bruttolön > 0) {
      bokföringsrader.push({
        konto: KONTO_MAPPNINGAR.grundlön.debet!,
        kontoNamn: KONTO_MAPPNINGAR.grundlön.namn,
        debet: bruttolön,
        kredit: 0,
        beskrivning: `Bruttolön inkl tillägg/avdrag - ${anställdNamn}`,
        anställdNamn,
      });
    }
    if (socialaAvgifter > 0) {
      bokföringsrader.push(
        {
          konto: KONTO_MAPPNINGAR.socialaAvgifter.debet!,
          kontoNamn: KONTO_MAPPNINGAR.socialaAvgifter.namn,
          debet: socialaAvgifter,
          kredit: 0,
          beskrivning: `Sociala avgifter - ${anställdNamn}`,
          anställdNamn,
        },
        {
          konto: KONTO_MAPPNINGAR.socialaAvgifter.kredit!,
          kontoNamn: "Avräkning lagstadgade sociala avgifter",
          debet: 0,
          kredit: socialaAvgifter,
          beskrivning: `Avräkning sociala avgifter - ${anställdNamn}`,
          anställdNamn,
        }
      );
    }
    if (skatt > 0) {
      bokföringsrader.push({
        konto: KONTO_MAPPNINGAR.preliminärSkatt.kredit!,
        kontoNamn: KONTO_MAPPNINGAR.preliminärSkatt.namn,
        debet: 0,
        kredit: skatt,
        beskrivning: `Preliminär skatt - ${anställdNamn}`,
        anställdNamn,
      });
    }
    // Nettolön = bruttolön - skatt
    const nettolön = bruttolön - skatt;
    if (nettolön > 0) {
      bokföringsrader.push({
        konto: KONTO_MAPPNINGAR.nettolön.kredit!,
        kontoNamn: KONTO_MAPPNINGAR.nettolön.namn,
        debet: 0,
        kredit: nettolön,
        beskrivning: `Nettolön utbetalning - ${anställdNamn}`,
        anställdNamn,
      });
    }
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
