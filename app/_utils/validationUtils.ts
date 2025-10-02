/**
 * Validerar årtal för bokföringsoperationer
 */
export function validateYear(year: number | string): boolean {
  const yearNum = typeof year === "string" ? parseInt(year) : year;
  const currentYear = new Date().getFullYear();

  return !isNaN(yearNum) && yearNum >= 2020 && yearNum <= currentYear + 1;
}

/**
 * Validerar period (YYYY format)
 */
export function validatePeriod(period: string): boolean {
  const yearPattern = /^\d{4}$/;
  if (!yearPattern.test(period)) return false;

  return validateYear(parseInt(period));
}

/**
 * Validerar databas-ID (positiva integers)
 */
export function validateId(id: number | string): boolean {
  const idNum = typeof id === "string" ? parseInt(id) : id;
  return !isNaN(idNum) && idNum > 0 && Number.isInteger(idNum);
}

/**
 * Validerar kontonummer (4-siffriga koden)
 */
export function validateKontonummer(kontonummer: string): boolean {
  const pattern = /^\d{4}$/;
  return pattern.test(kontonummer);
}

/**
 * UNIFIED INPUT SANITIZATION SYSTEM
 * Centraliserad och konsistent sanitisering över hela applikationen
 */

/**
 * Universal sanitisering med konfigurerbar längdgräns
 * Filtrerar farliga tecken och begränsar längd
 */
export function sanitizeInput(input: string, maxLength: number = 1000): string {
  if (!input) return "";

  return input
    .trim()
    .replace(/[<>\"'&]/g, "") // Ta bort farliga tecken (inkl & från lokala implementationer)
    .slice(0, maxLength);
}

/**
 * Sanitisering för formulärdata (ex. signup, kontaktformulär)
 * Kortare gräns för formulärfält
 */
export function sanitizeFormInput(input: string): string {
  return sanitizeInput(input, 200);
}

/**
 * Sanitisering för export/rapport data (ex. SIE export)
 * Längre gräns för exportdata
 */
export function sanitizeExportInput(input: string): string {
  return sanitizeInput(input, 1000);
}

/**
 * Sanitisering för admin operationer
 * Flexibel gräns för administrativa funktioner
 * @param input - Texten som ska saniteras
 * @param isSQL - Om true, behålls citattecken för SQL-syntax
 */
export function sanitizeAdminInput(input: string, isSQL: boolean = false): string {
  if (!input) return "";

  if (isSQL) {
    // För SQL: behåll citattecken men ta bort farliga tecken
    return input.trim().replace(/[<>&]/g, "").slice(0, 5000);
  }

  // Standard admin sanitizing
  return sanitizeInput(input, 500);
}

/**
 * Validerar belopp (positiva decimaler)
 */
export function validateAmount(amount: number | string): boolean {
  const amountNum = typeof amount === "string" ? parseFloat(amount) : amount;
  return !isNaN(amountNum) && amountNum >= 0 && isFinite(amountNum);
}

/**
 * Validerar datum i YYYY-MM-DD format
 */
export function validateDate(date: string): boolean {
  const pattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!pattern.test(date)) return false;

  const dateObj = new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj.getTime());
}

/**
 * Kombinerad validator som kastar specifika fel
 */
export function requireValid<T>(value: T, validator: (val: T) => boolean, errorMessage: string): T {
  if (!validator(value)) {
    throw new Error(errorMessage);
  }
  return value;
}

/**
 * Validerar filstorlek (i bytes)
 */
export function validateFileSize(size: number, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return size > 0 && size <= maxSizeBytes;
}

/**
 * Validerar SQL-injection risker
 */
export function isSafeSql(sql: string): boolean {
  const dangerousPatterns = [
    /;\s*DROP/i,
    /;\s*DELETE\s+FROM/i,
    /;\s*TRUNCATE/i,
    /;\s*ALTER\s+TABLE/i,
    /;\s*CREATE\s+USER/i,
    /;\s*GRANT/i,
    /;\s*REVOKE/i,
  ];

  return !dangerousPatterns.some((pattern) => pattern.test(sql));
}

/**
 * Validerar svenskt personnummer (YYMMDD-XXXX eller YYYYMMDD-XXXX format)
 * Stöder både 10-siffriga (YYMMDD-XXXX) och 12-siffriga (YYYYMMDD-XXXX) format
 * Personnummer är valfritt - returnerar true för tomma strängar
 */
export function validatePersonnummer(personnummer: string): boolean {
  if (!personnummer) return true; // Personnummer är valfritt

  // Ta bort mellanslag och normalisera
  const cleaned = personnummer.replace(/\s/g, "");

  // Acceptera både YYMMDD-XXXX och YYYYMMDD-XXXX format
  const pattern10 = /^\d{6}-?\d{4}$/; // YYMMDD-XXXX eller YYMMDDXXXX
  const pattern12 = /^\d{8}-?\d{4}$/; // YYYYMMDD-XXXX eller YYYYMMDDXXXX

  return pattern10.test(cleaned) || pattern12.test(cleaned);
}

/**
 * Validerar email-adress
 */
export function validateEmail(email: string): boolean {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
