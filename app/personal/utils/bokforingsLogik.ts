// Synkad & kontrollerad 2025-07-15
import { KONTO_MAPPNINGAR, hittaBokföringsregel, type BokföringsRegel } from "./bokforingsRegler";
import {
  klassificeraExtrarader,
  beräknaSkattTabell34,
  beräknaSocialaAvgifter,
  beräknaDaglön,
} from "../components/Anstallda/Lonespecar/loneberakningar";
import { RAD_KONFIGURATIONER } from "../components/Anstallda/Lonespecar/Extrarader/extraradDefinitioner";

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
    // ...existing code...
    // Beräkna tillägg till bruttolön
    let tillaggBruttolon = 0;
    (lönespec.extrarader || []).forEach((rad: any) => {
      const konfig = rad.typ && RAD_KONFIGURATIONER[rad.typ];
      if (konfig && konfig.läggTillIBruttolön) {
        tillaggBruttolon += Number(rad.kolumn3) || 0;
      }
    });
    // Bokio-style: Bokför grundlön + tillägg på 7210
    const bokioBruttolon = grundlön + tillaggBruttolon;

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
    // ...existing code...
    // Bruttolön = månadslön + tillägg - avdrag (VAB/föräldraledighet)
    const daglon = beräknaDaglön(grundlön);
    const totalAvdrag = daglon * (antalForaldraledighet + antalVab);
    const bruttolönKorr = grundlön + tillaggBruttolon - totalAvdrag;

    // Skatt och sociala avgifter på korrigerad bruttolön
    const skatt = beräknaSkattTabell34(bokioBruttolon);
    const socialaAvgifter = beräknaSocialaAvgifter(bokioBruttolon, socialaAvgifterSats);

    // Bokföringsrader
    // Bokför grundlön + tillägg på 7210
    if (bokioBruttolon > 0) {
      bokföringsrader.push({
        konto: KONTO_MAPPNINGAR.grundlön.debet!,
        kontoNamn: KONTO_MAPPNINGAR.grundlön.namn,
        debet: Math.round(bokioBruttolon * 100) / 100,
        kredit: 0,
        beskrivning: `Bruttolön (utan avdrag) - ${anställdNamn}`,
        anställdNamn,
      });
    }

    // Bokför avdrag på separata konton (7281)
    const avdragsTyper = [
      "foraldraledighet",
      "vab",
      "obetaldFranvaro",
      "karensavdrag",
      "reduceradeDagar",
    ];
    (lönespec.extrarader || []).forEach((rad: any) => {
      if (avdragsTyper.includes(rad.typ)) {
        const belopp = Number(
          require("../Lonespecar/Extrarader/extraraderUtils").beräknaSumma(rad.typ, rad, grundlön)
        );
        if (belopp !== 0) {
          bokföringsrader.push({
            konto: "7281",
            kontoNamn: "Avdrag/frånvaro tjänstemän",
            debet: belopp > 0 ? belopp : 0,
            kredit: belopp < 0 ? Math.abs(belopp) : 0,
            beskrivning: `${RAD_KONFIGURATIONER[rad.typ]?.label || rad.typ} - ${anställdNamn}`,
            anställdNamn,
          });
        }
      }
    });

    // --- GENERERA ALLA EXTRARADER SOM EGNA BOKFÖRINGSRADER ---
    let socialaAvgifterFörmåner = 0;
    let skattepliktigaFormanerSumma = 0;
    (lönespec.extrarader || []).forEach((rad: any) => {
      const konfig = rad.typ && RAD_KONFIGURATIONER[rad.typ];
      if (!konfig) return;
      // Beräkna beloppet med samma logik som lönespecen (använder beräknaSumma)
      // Grundlön behövs för vissa automatiska rader
      const belopp = Number(
        require("../Lonespecar/Extrarader/extraraderUtils").beräknaSumma(rad.typ, rad, grundlön)
      );
      // Visa alltid raden, även om beloppet är 0

      // Förmåner och traktamenten på egna konton
      if (
        [
          "gratisFrukost",
          "gratisLunchMiddag",
          "gratisMat",
          "boende",
          "forsakring",
          "parkering",
          "annanForman",
          "ranteforman",
        ].includes(rad.typ)
      ) {
        bokföringsrader.push({
          konto: "7382", // Fri mat/lunch/middag
          kontoNamn: "Kostnader för fria eller subventionerade måltider",
          debet:
            rad.typ === "gratisFrukost" ||
            rad.typ === "gratisLunchMiddag" ||
            rad.typ === "gratisMat"
              ? belopp
              : 0,
          kredit: 0,
          beskrivning: `${konfig.label} - ${anställdNamn}`,
          anställdNamn,
        });
        // Fri bostad
        if (rad.typ === "boende") {
          bokföringsrader.push({
            konto: "7381",
            kontoNamn: "Kostnader för fri bostad",
            debet: belopp,
            kredit: 0,
            beskrivning: `Boendeförmån - ${anställdNamn}`,
            anställdNamn,
          });
        }
        // Ränteförmån
        if (rad.typ === "ranteforman") {
          bokföringsrader.push({
            konto: "7386",
            kontoNamn: "Subventionerad ränta",
            debet: belopp,
            kredit: 0,
            beskrivning: `Ränteförmån - ${anställdNamn}`,
            anställdNamn,
          });
        }
        // Övriga förmåner
        if (["forsakring", "parkering", "annanForman"].includes(rad.typ)) {
          bokföringsrader.push({
            konto: "7389",
            kontoNamn: "Övriga kostnader för förmåner",
            debet: belopp,
            kredit: 0,
            beskrivning: `${konfig.label} - ${anställdNamn}`,
            anställdNamn,
          });
        }
        // Motkonto för skattepliktiga förmåner
        if (konfig.skattepliktig) {
          bokföringsrader.push({
            konto: "7399",
            kontoNamn: "Motkonto skattepliktiga förmåner",
            debet: 0,
            kredit: belopp,
            beskrivning: `Motkonto förmåner - ${anställdNamn}`,
            anställdNamn,
          });
          skattepliktigaFormanerSumma += belopp;
          socialaAvgifterFörmåner += belopp * socialaAvgifterSats;
        }
        return;
      }
      // Traktamenten
      if (["resersattning", "logi", "uppehalleInrikes", "uppehalleUtrikes"].includes(rad.typ)) {
        bokföringsrader.push({
          konto: "7321",
          kontoNamn: "Skattefria traktamenten, Sverige",
          debet: belopp,
          kredit: 0,
          beskrivning: `${konfig.label} - ${anställdNamn}`,
          anställdNamn,
        });
        // Sociala avgifter på traktamente om skattepliktigt
        if (konfig.skattepliktig) {
          socialaAvgifterFörmåner += belopp * socialaAvgifterSats;
        }
        return;
      }
      // Bilersättning
      if (["privatBil", "foretagsbilBensinDiesel", "foretagsbilEl"].includes(rad.typ)) {
        bokföringsrader.push({
          konto: "7281",
          kontoNamn: "Reseersättningar",
          debet: belopp,
          kredit: 0,
          beskrivning: `${konfig.label} - ${anställdNamn}`,
          anställdNamn,
        });
        return;
      }
      // Övriga extrarader: använd befintlig logik
      if (konfig.konto) {
        bokföringsrader.push({
          konto: konfig.konto,
          kontoNamn: konfig.kontoNamn || konfig.namn || rad.namn || rad.typ,
          debet: konfig.typ === "debet" ? belopp : 0,
          kredit: konfig.typ === "kredit" ? belopp : 0,
          beskrivning: `${konfig.beskrivning ? konfig.beskrivning + " - " : ""}${anställdNamn} (extrarad: ${rad.typ}, belopp: ${belopp} kr, konto: ${konfig.konto})`,
          anställdNamn,
        });
      }
    });
    // Sociala avgifter på förmåner och traktamenten
    if (socialaAvgifterFörmåner > 0) {
      bokföringsrader.push({
        konto: "7515",
        kontoNamn: "Sociala avgifter på skattepliktiga kostnadsersättningar",
        debet: Math.round(socialaAvgifterFörmåner * 100) / 100,
        kredit: 0,
        beskrivning: `Sociala avgifter på förmåner/traktamenten - ${anställdNamn}`,
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

  // Filtrera bort rader där både debet och kredit är 0
  const filtreradeRader = bokföringsrader.filter(
    (rad) => (rad.debet || 0) !== 0 || (rad.kredit || 0) !== 0
  );

  // Sortera enligt Bokios ordning
  const bokioOrdning = [
    "1930",
    "2710",
    "2731",
    "2920",
    "2940",
    "7210",
    "7281",
    "7290",
    "7321",
    "7381",
    "7382",
    "7386",
    "7389",
    "7399",
    "7510",
    "7515",
    "7519",
  ];
  const sorteradeRader = filtreradeRader.sort((a, b) => {
    const ia = bokioOrdning.indexOf(a.konto);
    const ib = bokioOrdning.indexOf(b.konto);
    if (ia === -1 && ib === -1) return a.konto.localeCompare(b.konto);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  const totalDebetFiltrerat = sorteradeRader.reduce((sum, rad) => sum + Number(rad.debet || 0), 0);
  const totalKreditFiltrerat = sorteradeRader.reduce(
    (sum, rad) => sum + Number(rad.kredit || 0),
    0
  );
  return {
    rader: sorteradeRader,
    totalDebet: Math.round(totalDebetFiltrerat * 100) / 100,
    totalKredit: Math.round(totalKreditFiltrerat * 100) / 100,
    balanserar: Math.abs(totalDebetFiltrerat - totalKreditFiltrerat) < 0.01,
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
