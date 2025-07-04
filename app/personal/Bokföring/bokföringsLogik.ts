import { KONTO_MAPPNINGAR, hittaBokföringsregel, type BokföringsRegel } from "./bokföringsRegler";

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

    // BERÄKNA VERKLIG BRUTTOLÖN
    let grundlön = Number(
      lönespec.beräknadeVärden?.bruttolön || lönespec.bruttolön || lönespec.grundlön || 0
    );
    let avdragSumma = 0;

    // RÄKNA AVDRAG FÖRST
    lönespec.extrarader?.forEach((rad: any) => {
      const belopp = Number(rad.kolumn3 || rad.belopp || 0);
      if (belopp < 0) {
        avdragSumma += Math.abs(belopp);
      }
    });

    // JUSTERA GRUNDLÖN MED AVDRAG
    const verkligBruttolön = grundlön - avdragSumma;

    // GRUNDLÖN (justerad)
    if (verkligBruttolön > 0) {
      bokföringsrader.push({
        konto: KONTO_MAPPNINGAR.grundlön.debet!,
        kontoNamn: KONTO_MAPPNINGAR.grundlön.namn,
        debet: verkligBruttolön,
        kredit: 0,
        beskrivning: `Grundlön - ${anställdNamn}`,
        anställdNamn,
      });
    }

    // EXTRARADER (bara tillägg och avdrag separat)
    lönespec.extrarader?.forEach((rad: any) => {
      const belopp = Number(rad.kolumn3 || rad.belopp || 0);
      const beskrivning = rad.kolumn1 || "Extrarad";
      if (belopp === 0) return;

      if (belopp > 0) {
        let regel = KONTO_MAPPNINGAR.grundlön;
        const desc = beskrivning.toLowerCase();
        if (desc.includes("övertid")) regel = KONTO_MAPPNINGAR.övertid;
        else if (desc.includes("bil")) regel = KONTO_MAPPNINGAR.bilförmån;
        else if (desc.includes("förmån")) regel = KONTO_MAPPNINGAR.annanForman;

        bokföringsrader.push({
          konto: regel.debet!,
          kontoNamn: regel.namn,
          debet: belopp,
          kredit: 0,
          beskrivning: `${beskrivning} - ${anställdNamn}`,
          anställdNamn,
        });
      }
      // AVDRAG HANTERAS GENOM REDUCERAD GRUNDLÖN, INGEN SEPARAT RAD
    });

    // SOCIALA AVGIFTER (på verklig bruttolön)
    const socialaAvgifter = Math.round(verkligBruttolön * 0.3142);
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

    // SKATT (på verklig bruttolön)
    const skatt = Math.round(verkligBruttolön * 0.25);
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

    // NETTOLÖN (bruttolön - skatt)
    const nettolön = verkligBruttolön - skatt;
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
