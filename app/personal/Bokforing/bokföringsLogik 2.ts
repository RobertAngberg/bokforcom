import { KONTO_MAPPNINGAR, hittaBokföringsregel, type BokföringsRegel } from "./bokföringsRegler";
import {
  klassificeraExtrarader,
  beräknaSkattTabell34,
  beräknaSocialaAvgifter,
  beräknaDaglön,
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
    const daglon = beräknaDaglön(grundlön);
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

    // --- GENERERA ALLA EXTRARADER SOM EGNA BOKFÖRINGSRADER ---
    (lönespec.extrarader || []).forEach((rad: any) => {
      const konfig = rad.typ && RAD_KONFIGURATIONER[rad.typ];
      if (!konfig || !konfig.konto) return;
      // Beloppet kan ligga i kolumn3, eller vara uträknat
      const belopp = Number(rad.kolumn3 || rad.belopp || 0);
      if (belopp === 0) return;
      bokföringsrader.push({
        konto: konfig.konto,
        kontoNamn: konfig.kontoNamn || konfig.namn || rad.namn || rad.typ,
        debet: konfig.typ === "debet" ? belopp : 0,
        kredit: konfig.typ === "kredit" ? belopp : 0,
        beskrivning: konfig.beskrivning
          ? `${konfig.beskrivning} - ${anställdNamn}`
          : `${rad.typ} - ${anställdNamn}`,
        anställdNamn,
      });
    });
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
    // Bokio-formel: semesterlöneskuld = månadslön * 0.1068
    const semesterloneskuld = Math.round(grundlön * 0.1068 * 100) / 100;
    const socialaSemesterAvgifter = Math.round(semesterloneskuld * socialaAvgifterSats * 100) / 100;
    bokföringsrader.push(
      {
        konto: "7290",
        kontoNamn: "Förändring av semesterlöneskuld",
        debet: semesterloneskuld,
        kredit: 0,
        beskrivning: `Förändring av semesterlöneskuld - ${anställdNamn}`,
        anställdNamn,
      },
      {
        konto: "2920",
        kontoNamn: "Upplupna semesterlöner",
        debet: 0,
        kredit: semesterloneskuld,
        beskrivning: `Upplupna semesterlöner - ${anställdNamn}`,
        anställdNamn,
      },
      {
        konto: "7519",
        kontoNamn: "Sociala avgifter för semester- och löneskulder",
        debet: socialaSemesterAvgifter,
        kredit: 0,
        beskrivning: `Sociala avgifter för semesterlöneskuld - ${anställdNamn}`,
        anställdNamn,
      },
      {
        konto: "2940",
        kontoNamn: "Upplupna lagstadgade sociala och andra avgifter",
        debet: 0,
        kredit: socialaSemesterAvgifter,
        beskrivning: `Upplupna lagstadgade sociala avgifter för semester - ${anställdNamn}`,
        anställdNamn,
      }
    );
  });

  const totalDebet = bokföringsrader.reduce((sum, rad) => sum + Number(rad.debet || 0), 0);
  const totalKredit = bokföringsrader.reduce((sum, rad) => sum + Number(rad.kredit || 0), 0);

  return {
    rader: bokföringsrader,
    totalDebet: Math.round(totalDebet * 100) / 100,
    totalKredit: Math.round(totalKredit * 100) / 100,
    balanserar: Math.abs(totalDebet - totalKredit) < 0.01,
  };
}

function summeraBokföringsrader(rader: BokföringsRad[]): BokföringsRad[] {
  const kontoMap = new Map<string, BokföringsRad>();

  rader.forEach((rad) => {
            // Visa extrarader även om beloppet är 0
    if (kontoMap.has(nyckel)) {
      const befintlig = kontoMap.get(nyckel)!;
      befintlig.debet += Number(rad.debet || 0);
      befintlig.kredit += Number(rad.kredit || 0);
    } else {
      kontoMap.set(nyckel, {
                  (konfig.beskrivning ? `${konfig.beskrivning} - ${anställdNamn}` : `${rad.typ} - ${anställdNamn}`) +
                  ` (extrarad: ${rad.typ}, belopp: ${belopp} kr, konto: ${konfig.konto})`,
      });
    }
  });

  return Array.from(kontoMap.values()).sort((a, b) => a.konto.localeCompare(b.konto));
}
