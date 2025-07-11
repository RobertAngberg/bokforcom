import { type BokföringsRad, type BokföringsSummering } from "./bokföringsLogik";

// FORMATERA BELOPP
export function formateraBeloppKronor(belopp: number): string {
  // Hantera NaN och undefined
  if (isNaN(belopp) || belopp == null) {
    return "0,00 kr";
  }

  return `${belopp.toLocaleString("sv-SE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} kr`;
}

// FORMATERA KONTO
export function formateraKonto(konto: string): string {
  return konto.padStart(4, "0");
}

// EXPORTERA TILL CSV
export function exporteraTillCSV(summering: BokföringsSummering, datum: Date): string {
  const header = "Konto,Kontonamn,Debet,Kredit\n";

  const rader = summering.rader
    .map(
      (rad) =>
        `${formateraKonto(rad.konto)},"${rad.kontoNamn}",${rad.debet || 0},${rad.kredit || 0}`
    )
    .join("\n");

  return header + rader;
}

// EXPORTERA TILL SIE-FORMAT (Simplified)
export function exporteraTillSIE(summering: BokföringsSummering, datum: Date): string {
  const datumStr = datum.toISOString().split("T")[0].replace(/-/g, "");

  let sie = `#FLAGGA 0\n`;
  sie += `#PROGRAM "Bokio Clone" "1.0"\n`;
  sie += `#FORMAT PC8\n`;
  sie += `#GEN ${datumStr}\n`;
  sie += `#SIETYP 4\n`;
  sie += `#FNAMN "Lönebok"\n`;
  sie += `#ORGNR ""\n`;
  sie += `#VALUTA SEK\n\n`;

  // Kontoplan
  sie += `#KONTO 1930 "Företagskonto / affärskonto"\n`;
  sie += `#KONTO 2710 "Personalskatt"\n`;
  sie += `#KONTO 2731 "Avräkning lagstadgade sociala avgifter"\n`;
  sie += `#KONTO 7210 "Löner till tjänstemän"\n`;
  sie += `#KONTO 7220 "Förmåner till anställda"\n`;
  sie += `#KONTO 7281 "Reseersättningar"\n`;
  sie += `#KONTO 7510 "Lagstadgade sociala avgifter"\n\n`;

  // Verifikat
  sie += `#VER "LÖN" "1" ${datumStr} "Lonekorning ${datum.toLocaleDateString("sv-SE")}"\n`;
  sie += `{\n`;

  summering.rader.forEach((rad) => {
    if ((rad.debet || 0) > 0) {
      sie += `#TRANS ${formateraKonto(rad.konto)} {} ${rad.debet || 0} ${datumStr} "${rad.beskrivning}"\n`;
    }
    if ((rad.kredit || 0) > 0) {
      sie += `#TRANS ${formateraKonto(rad.konto)} {} -${rad.kredit || 0} ${datumStr} "${rad.beskrivning}"\n`;
    }
  });

  sie += `}\n`;

  return sie;
}

// VALIDERA BOKFÖRING
export function valideraBokföring(summering: BokföringsSummering): string[] {
  const fel: string[] = [];

  // Kontrollera balans
  if (!summering.balanserar) {
    fel.push(
      `Bokföringen balanserar inte! Debet: ${formateraBeloppKronor(summering.totalDebet)}, Kredit: ${formateraBeloppKronor(summering.totalKredit)}`
    );
  }

  // Kontrollera tomma konton
  summering.rader.forEach((rad) => {
    if (!rad.konto || rad.konto.trim() === "") {
      fel.push(`Tomt kontonummer för rad: ${rad.beskrivning}`);
    }

    if ((rad.debet || 0) === 0 && (rad.kredit || 0) === 0) {
      fel.push(`Rad utan belopp: ${rad.beskrivning}`);
    }

    if ((rad.debet || 0) < 0 || (rad.kredit || 0) < 0) {
      fel.push(`Negativt belopp på rad: ${rad.beskrivning}`);
    }

    // Kontrollera NaN
    if (isNaN(rad.debet || 0) || isNaN(rad.kredit || 0)) {
      fel.push(`Felaktigt belopp (NaN) på rad: ${rad.beskrivning}`);
    }
  });

  // Kontrollera minimiberlopp
  const minBelopp = 0.01;
  summering.rader.forEach((rad) => {
    const debet = rad.debet || 0;
    const kredit = rad.kredit || 0;

    if (debet > 0 && debet < minBelopp) {
      fel.push(`För lågt debetbelopp (${debet}) på rad: ${rad.beskrivning}`);
    }
    if (kredit > 0 && kredit < minBelopp) {
      fel.push(`För lågt kreditbelopp (${kredit}) på rad: ${rad.beskrivning}`);
    }
  });

  // Kontrollera totalsummor
  if (isNaN(summering.totalDebet) || isNaN(summering.totalKredit)) {
    fel.push("Totalsummorna innehåller felaktiga värden (NaN)");
  }

  return fel;
}

// LADDA NER FIL
export function laddaNerFil(innehåll: string, filnamn: string, mimeType: string = "text/plain") {
  const blob = new Blob([innehåll], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filnamn;
  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// GENERERA FILNAMN
export function genereraFilnamn(prefix: string, datum: Date, extension: string): string {
  const datumStr = datum.toISOString().split("T")[0];
  return `${prefix}_${datumStr}.${extension}`;
}

// SÄKRA NUMMER-KONVERTERING
export function säkertNummer(värde: any): number {
  if (värde == null || värde === "") return 0;
  const nummer = parseFloat(värde);
  return isNaN(nummer) ? 0 : nummer;
}

// FORMATERA BELOPP UTAN "kr"
export function formateraBelopp(belopp: number): string {
  if (isNaN(belopp) || belopp == null) {
    return "0,00";
  }

  return belopp.toLocaleString("sv-SE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
