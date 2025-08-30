/**
 * Centraliserade fil-utilities
 * Eliminerar upprepning av fil-hanteringslogik
 */

/**
 * Ladda ner fil från innehåll
 * Konsoliderad version från personal/Bokforing/bokforingsUtils.ts
 */
export function downloadFile(
  content: string | Blob,
  filename: string,
  mimeType: string = "text/plain"
): void {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generera filnamn med datum
 * Konsoliderad version från personal/Bokforing/bokforingsUtils.ts
 */
export function generateFilename(prefix: string, date: Date, extension: string): string {
  const dateStr = date.toISOString().split("T")[0];
  return `${prefix}_${dateStr}.${extension}`;
}

/**
 * Centraliserad filnamn-sanitization
 * Konsoliderar olika versioner från hela applikationen
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "_") // Ersätt osäkra tecken
    .replace(/_{2,}/g, "_") // Sammanslå flera understreck
    .substring(0, 100) // Begränsa längd
    .toLowerCase();
}

/**
 * Förkonfigurerade download-funktioner för vanliga användningsfall
 */
export const downloadCSV = (content: string, filename: string) =>
  downloadFile(content, filename, "text/csv");

export const downloadJSON = (data: object, filename: string) =>
  downloadFile(JSON.stringify(data, null, 2), filename, "application/json");

export const downloadXML = (content: string, filename: string) =>
  downloadFile(content, filename, "application/xml");

export const downloadPDF = (blob: Blob, filename: string) =>
  downloadFile(blob, filename, "application/pdf");

// Legacy aliases för bakåtkompatibilitet
export const laddaNerFil = downloadFile;
export const genereraFilnamn = generateFilename;

/**
 * Huvudbok export-funktioner
 * Modulära funktioner för CSV och PDF export av huvudboksdata
 */

// Typdefinitioner för huvudbok
type HuvudbokTransaktion = {
  transaktion_id: number;
  datum: string;
  beskrivning: string;
  debet: number | null;
  kredit: number | null;
  verifikatNummer: string;
  belopp: number;
  lopande_saldo: number;
  sort_priority: number;
};

type HuvudbokKonto = {
  kontonummer: string;
  beskrivning: string;
  ingaendeBalans: number;
  utgaendeBalans: number;
  transaktioner: HuvudbokTransaktion[];
};

/**
 * Formatera SEK med svensk lokalformatering för PDF och CSV export
 *
 * VIKTIGT: Använder vanligt ASCII minus (-) istället för Unicode minus (−)
 * Anledning: Unicode minus (U+2212) visas som konstiga tecken i PDF:er
 * Exempel av problem: "-3 815,79kr" blev "3 815,79kr" i PDF
 * Lösning: Använd ASCII minus (-) som fungerar korrekt i alla format
 */
function formatSEKForExport(val: number): string {
  if (val === 0) return "0kr";
  const isNegative = val < 0;
  const absVal = Math.abs(val);
  const formatted = absVal.toLocaleString("sv-SE") + "kr";
  return isNegative ? `-${formatted}` : formatted; // ASCII minus (-) INTE Unicode minus (−)
}

/**
 * Exportera huvudbok till CSV
 */
export function exportHuvudbokCSV(
  konton: HuvudbokKonto[],
  företagsnamn: string,
  selectedMonth: string,
  selectedYear: string
): void {
  try {
    const monthNames = {
      "01": "Januari",
      "02": "Februari",
      "03": "Mars",
      "04": "April",
      "05": "Maj",
      "06": "Juni",
      "07": "Juli",
      "08": "Augusti",
      "09": "September",
      "10": "Oktober",
      "11": "November",
      "12": "December",
    };

    const period =
      selectedMonth === "alla"
        ? `Helår ${selectedYear}`
        : `${monthNames[selectedMonth as keyof typeof monthNames]} ${selectedYear}`;

    let csv = `Huvudbok - ${period}\n`;
    if (företagsnamn) {
      csv += `${företagsnamn}\n`;
    }
    csv += `Utskriven: ${new Date().toLocaleDateString("sv-SE")}\n\n`;

    konton.forEach((konto) => {
      csv += `\nKonto ${konto.kontonummer} - ${konto.beskrivning}\n`;
      csv += `Ingående balans: ${formatSEKForExport(konto.ingaendeBalans)}\n`;
      csv += `Datum;Verifikat;Beskrivning;Debet;Kredit;Saldo\n`;

      konto.transaktioner.forEach((trans) => {
        const datum =
          trans.sort_priority === 1 ? "" : new Date(trans.datum).toLocaleDateString("sv-SE");
        const debet = trans.debet ? formatSEKForExport(trans.debet) : "−";
        const kredit = trans.kredit ? formatSEKForExport(trans.kredit) : "−";

        csv += `${datum};"${trans.verifikatNummer}";"${trans.beskrivning}";${debet};${kredit};${formatSEKForExport(trans.lopande_saldo)}\n`;
      });

      csv += `;Utgående balans;;;−;−;${formatSEKForExport(konto.utgaendeBalans)}\n`;
    });

    const filename = generateFilename(
      `huvudbok_${selectedYear}${selectedMonth !== "alla" ? `_${selectedMonth}` : ""}`,
      new Date(),
      "csv"
    );
    downloadCSV(csv, filename);
  } catch (error) {
    console.error("CSV Export error:", error);
    throw new Error("Ett fel uppstod vid CSV-exporten");
  }
}

/**
 * Exportera huvudbok till PDF
 */
export async function exportHuvudbokPDF(
  konton: HuvudbokKonto[],
  företagsnamn: string,
  selectedMonth: string,
  selectedYear: string
): Promise<void> {
  try {
    // Dynamisk import av jsPDF för att undvika SSR-problem
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const monthNames = {
      "01": "Januari",
      "02": "Februari",
      "03": "Mars",
      "04": "April",
      "05": "Maj",
      "06": "Juni",
      "07": "Juli",
      "08": "Augusti",
      "09": "September",
      "10": "Oktober",
      "11": "November",
      "12": "December",
    };

    const period =
      selectedMonth === "alla"
        ? `Helår ${selectedYear}`
        : `${monthNames[selectedMonth as keyof typeof monthNames]} ${selectedYear}`;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    let y = 30;

    // Header
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("Huvudbok", 105, y, { align: "center" });
    y += 8;

    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    doc.text(period, 105, y, { align: "center" });
    y += 15;

    // Företagsnamn
    if (företagsnamn) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(företagsnamn, 14, y);
      y += 10;
    }

    // Utskrivet datum
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Utskriven: ${new Date().toLocaleDateString("sv-SE")}`, 14, y);
    y += 15;

    // Loopa genom alla konton
    for (const konto of konton) {
      // Kontrollera om vi behöver ny sida
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      // Kontohuvud
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`Konto ${konto.kontonummer} - ${konto.beskrivning}`, 14, y);
      y += 6;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Ingående balans: ${formatSEKForExport(konto.ingaendeBalans)}`, 14, y);
      y += 8;

      // Transaktionstabell
      const tableData = konto.transaktioner.map((trans) => [
        trans.sort_priority === 1 ? "" : new Date(trans.datum).toLocaleDateString("sv-SE"),
        trans.verifikatNummer,
        trans.beskrivning,
        trans.debet ? formatSEKForExport(trans.debet) : "−",
        trans.kredit ? formatSEKForExport(trans.kredit) : "−",
        formatSEKForExport(trans.lopande_saldo),
      ]);

      // Lägg till utgående balans rad
      tableData.push([
        "",
        "Utgående balans",
        "",
        "−",
        "−",
        formatSEKForExport(konto.utgaendeBalans),
      ]);

      autoTable(doc, {
        startY: y,
        head: [["Datum", "Verifikat", "Beskrivning", "Debet", "Kredit", "Saldo"]],
        body: tableData,
        theme: "striped",
        headStyles: {
          fillColor: [64, 64, 64],
          textColor: 255,
          fontSize: 9,
          fontStyle: "bold",
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [33, 37, 41],
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250],
        },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 25 },
          2: { cellWidth: 65 },
          3: { cellWidth: 25, halign: "right" },
          4: { cellWidth: 25, halign: "right" },
          5: { cellWidth: 30, halign: "right", fontStyle: "bold" },
        },
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
          if (data.cursor) y = data.cursor.y + 10;
        },
      });

      y += 5;
    }

    const filename = generateFilename(
      `huvudbok_${selectedYear}${selectedMonth !== "alla" ? `_${selectedMonth}` : ""}`,
      new Date(),
      "pdf"
    );

    const pdfBlob = doc.output("blob");
    downloadPDF(pdfBlob, filename);
  } catch (error) {
    console.error("PDF Export error:", error);
    throw new Error("Ett fel uppstod vid PDF-exporten");
  }
}

/**
 * Balansrapport export-funktioner
 * Modulära funktioner för CSV och PDF export av balansrapportdata
 */

// Typdefinitioner för balansrapport
type BalansKonto = {
  kontonummer: string;
  beskrivning: string;
  ingaendeSaldo: number;
  aretsResultat: number;
  utgaendeSaldo: number;
};

/**
 * Exportera balansrapport till CSV
 */
export function exportBalansrapportCSV(
  tillgangar: BalansKonto[],
  skulderOchEgetKapital: BalansKonto[],
  sumTillgangar: number,
  sumSkulderEK: number,
  beraknatResultat: number,
  företagsnamn: string,
  organisationsnummer: string,
  selectedMonth: string,
  selectedYear: string
): void {
  try {
    const monthNames = {
      "01": "Januari",
      "02": "Februari",
      "03": "Mars",
      "04": "April",
      "05": "Maj",
      "06": "Juni",
      "07": "Juli",
      "08": "Augusti",
      "09": "September",
      "10": "Oktober",
      "11": "November",
      "12": "December",
    };

    const period =
      selectedMonth === "alla"
        ? `Helår ${selectedYear}`
        : `${monthNames[selectedMonth as keyof typeof monthNames]} ${selectedYear}`;

    let csv = `Balansrapport - ${period}\n`;
    if (företagsnamn) {
      csv += `${företagsnamn}\n`;
    }
    if (organisationsnummer) {
      csv += `${organisationsnummer}\n`;
    }
    csv += `Utskriven: ${new Date().toLocaleDateString("sv-SE")}\n\n`;

    csv += `Tillgångar\nKonto;Beskrivning;Ing. balans ${selectedYear}-01-01;Resultat;Utg. balans ${selectedYear}-12-31\n`;
    let ingaendeTillgangar = 0;
    let aretsTillgangar = 0;
    tillgangar.forEach((konto) => {
      csv += `${konto.kontonummer};"${konto.beskrivning}";${formatSEKForExport(konto.ingaendeSaldo)};${formatSEKForExport(konto.aretsResultat)};${formatSEKForExport(konto.utgaendeSaldo)}\n`;
      ingaendeTillgangar += konto.ingaendeSaldo;
      aretsTillgangar += konto.aretsResultat;
    });
    csv += `;;${formatSEKForExport(ingaendeTillgangar)};${formatSEKForExport(aretsTillgangar)};${formatSEKForExport(sumTillgangar)}\n\n`;

    csv += `Eget kapital och skulder\nKonto;Beskrivning;Ing. balans ${selectedYear}-01-01;Resultat;Utg. balans ${selectedYear}-12-31\n`;
    let ingaendeSkulder = 0;
    let aretsSkulder = 0;
    skulderOchEgetKapital.forEach((konto) => {
      csv += `${konto.kontonummer};"${konto.beskrivning}";${formatSEKForExport(konto.ingaendeSaldo)};${formatSEKForExport(konto.aretsResultat)};${formatSEKForExport(konto.utgaendeSaldo)}\n`;
      ingaendeSkulder += konto.ingaendeSaldo;
      aretsSkulder += konto.aretsResultat;
    });
    csv += `;;${formatSEKForExport(ingaendeSkulder)};${formatSEKForExport(aretsSkulder)};${formatSEKForExport(sumSkulderEK)}\n\n`;

    csv += "Balanskontroll\n";
    if (beraknatResultat !== 0) {
      csv += `Beräknat resultat;${formatSEKForExport(beraknatResultat)}\n`;
    }

    const filename = generateFilename(
      `balansrapport_${selectedYear}${selectedMonth !== "alla" ? `_${selectedMonth}` : ""}`,
      new Date(),
      "csv"
    );
    downloadCSV(csv, filename);
  } catch (error) {
    console.error("CSV Export error:", error);
    throw new Error("Ett fel uppstod vid CSV-exporten");
  }
}

/**
 * Exportera balansrapport till PDF
 */
export async function exportBalansrapportPDF(
  tillgangar: BalansKonto[],
  skulderOchEgetKapital: BalansKonto[],
  sumTillgangar: number,
  sumSkulderEK: number,
  beraknatResultat: number,
  företagsnamn: string,
  organisationsnummer: string,
  selectedMonth: string,
  selectedYear: string
): Promise<void> {
  try {
    // Dynamisk import av jsPDF för att undvika SSR-problem
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const monthNames = {
      "01": "Januari",
      "02": "Februari",
      "03": "Mars",
      "04": "April",
      "05": "Maj",
      "06": "Juni",
      "07": "Juli",
      "08": "Augusti",
      "09": "September",
      "10": "Oktober",
      "11": "November",
      "12": "December",
    };

    const period =
      selectedMonth === "alla"
        ? `Helår ${selectedYear}`
        : `${monthNames[selectedMonth as keyof typeof monthNames]} ${selectedYear}`;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    let y = 30;

    // Header
    doc.setFontSize(32);
    doc.text("Balansrapport", 105, y, { align: "center" });
    y += 10;

    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    doc.text(period, 105, y, { align: "center" });
    y += 15;

    // Företagsnamn (bold)
    if (företagsnamn) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(företagsnamn, 14, y);
      y += 7;
    }

    // Organisationsnummer (normal)
    if (organisationsnummer) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(organisationsnummer, 14, y);
      y += 8;
    }

    // Utskriven datum
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Utskriven: ${new Date().toLocaleDateString("sv-SE")}`, 14, y);
    y += 18;

    // Dynamiska grupper
    const grupper = [
      { titel: "Tillgångar", konton: tillgangar, summa: sumTillgangar },
      { titel: "Eget kapital och skulder", konton: skulderOchEgetKapital, summa: sumSkulderEK },
    ];

    grupper.forEach(({ titel, konton, summa }) => {
      doc.setFontSize(15);
      doc.setFont("helvetica", "bold");
      doc.text(titel, 14, y);
      y += 8;

      // Tabellrader med tre kolumner som webbgränssnittet
      const rows: any[][] = konton.map((konto) => [
        konto.kontonummer,
        konto.beskrivning,
        formatSEKForExport(konto.ingaendeSaldo || 0),
        formatSEKForExport(konto.aretsResultat || 0),
        formatSEKForExport(konto.utgaendeSaldo || 0),
      ]);

      // Summeringsrad med colSpan för första två kolumner
      const ingaendeSum = konton.reduce((sum, k) => sum + (k.ingaendeSaldo || 0), 0);
      const aretsSum = konton.reduce((sum, k) => sum + (k.aretsResultat || 0), 0);
      rows.push([
        { content: `Summa ${titel.toLowerCase()}`, colSpan: 2, styles: { fontStyle: "bold" } },
        {
          content: formatSEKForExport(ingaendeSum),
          styles: { fontStyle: "bold", halign: "right" },
        },
        { content: formatSEKForExport(aretsSum), styles: { fontStyle: "bold", halign: "right" } },
        { content: formatSEKForExport(summa), styles: { fontStyle: "bold", halign: "right" } },
      ]);

      autoTable(doc, {
        startY: y,
        head: [
          [
            "Konto",
            "Beskrivning",
            `Ing. balans ${selectedYear}-01-01`,
            "Resultat",
            `Utg. balans ${selectedYear}-12-31`,
          ],
        ],
        body: rows,
        theme: "striped",
        headStyles: {
          fillColor: [64, 64, 64],
          textColor: 255,
          fontSize: 10,
          fontStyle: "bold",
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [33, 37, 41],
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250],
        },
        columnStyles: {
          0: { cellWidth: 24 }, // Konto
          1: { cellWidth: 75 }, // Beskrivning
          2: { cellWidth: 28, halign: "right" }, // Ing. balans
          3: { cellWidth: 28, halign: "right" }, // Resultat
          4: { cellWidth: 28, halign: "right" }, // Utg. balans
        },
        margin: { left: 10, right: 10 },
        didDrawPage: (data) => {
          if (data.cursor) y = data.cursor.y + 8;
        },
      });

      y += 4;
    });

    const filename = generateFilename(
      `balansrapport_${selectedYear}${selectedMonth !== "alla" ? `_${selectedMonth}` : ""}`,
      new Date(),
      "pdf"
    );

    const pdfBlob = doc.output("blob");
    downloadPDF(pdfBlob, filename);
  } catch (error) {
    console.error("PDF Export error:", error);
    throw new Error("Ett fel uppstod vid PDF-exporten");
  }
}
