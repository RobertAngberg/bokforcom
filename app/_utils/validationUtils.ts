export function validateYear(year: number | string): boolean {
  const yearNum = typeof year === "string" ? parseInt(year) : year;
  const currentYear = new Date().getFullYear();

  return !isNaN(yearNum) && yearNum >= 2020 && yearNum <= currentYear + 1;
}

export function validatePeriod(period: string): boolean {
  const yearPattern = /^\d{4}$/;
  if (!yearPattern.test(period)) return false;

  return validateYear(parseInt(period));
}

export function validateId(id: number | string): boolean {
  const idNum = typeof id === "string" ? parseInt(id) : id;
  return !isNaN(idNum) && idNum > 0 && Number.isInteger(idNum);
}

export function sanitizeInput(input: string, maxLength: number = 1000): string {
  if (!input) return "";

  return input
    .trim()
    .replace(/[<>\"'&]/g, "") // Ta bort farliga tecken (inkl & från lokala implementationer)
    .slice(0, maxLength);
}

export function validateAmount(amount: number | string): boolean {
  const amountNum = typeof amount === "string" ? parseFloat(amount) : amount;
  return !isNaN(amountNum) && amountNum >= 0 && isFinite(amountNum);
}

export function validatePersonnummer(personnummer: string): boolean {
  if (!personnummer) return true; // Personnummer är valfritt

  // Ta bort mellanslag och normalisera
  const cleaned = personnummer.replace(/\s/g, "");

  // Acceptera både YYMMDD-XXXX och YYYYMMDD-XXXX format
  const pattern10 = /^\d{6}-?\d{4}$/; // YYMMDD-XXXX eller YYMMDDXXXX
  const pattern12 = /^\d{8}-?\d{4}$/; // YYYYMMDD-XXXX eller YYYYMMDDXXXX

  return pattern10.test(cleaned) || pattern12.test(cleaned);
}

export function validateEmail(email: string): boolean {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validerar kontonummer, alltså BAS
 */
export function validateKontonummer(kontonummer: string): boolean {
  const pattern = /^\d{4}$/;
  return pattern.test(kontonummer);
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
