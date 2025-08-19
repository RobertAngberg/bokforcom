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
