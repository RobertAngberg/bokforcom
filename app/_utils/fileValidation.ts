/**
 * =================================================================
 * FILVALIDERINGS-FUNKTIONER
 * Centraliserad filvalidering för hela projektet
 * =================================================================
 */

// Tillåtna filtyper för bokföringsbilagor
export const ALLOWED_FILE_TYPES = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
} as const;

// Max filstorlek för olika typer
export const MAX_FILE_SIZES = {
  image: 10 * 1024 * 1024, // 10MB för bilagor (PDF/bilder)
  sie: 50 * 1024 * 1024, // 50MB för SIE-filer
  email: 8 * 1024 * 1024, // 8MB för email-bilagor
} as const;

/**
 * Validerar filstorlek
 */
export function validateFileSize(
  size: number,
  maxSize: number = MAX_FILE_SIZES.image
): { valid: boolean; error?: string } {
  if (size > maxSize) {
    return {
      valid: false,
      error: `Filen är för stor (${Math.round(size / 1024 / 1024)}MB). Max ${Math.round(maxSize / 1024 / 1024)}MB tillåtet.`,
    };
  }
  return { valid: true };
}

/**
 * Validerar filtyp för bokföringsbilagor (PDF/bilder)
 */
export function validateFileType(
  fileType: string,
  allowedTypes: Record<string, string> = ALLOWED_FILE_TYPES
): { valid: boolean; error?: string } {
  if (!allowedTypes[fileType as keyof typeof allowedTypes]) {
    const extensions = Object.values(allowedTypes).join(", ");
    return {
      valid: false,
      error: `Ogiltig filtyp. Tillåtna format: ${extensions}`,
    };
  }
  return { valid: true };
}

/**
 * Validerar filnamn för säkra tecken
 */
export function validateFilename(filename: string): { valid: boolean; error?: string } {
  const unsafeChars = /[<>:"/\\|?*\x00-\x1f]/;
  if (unsafeChars.test(filename)) {
    return {
      valid: false,
      error: "Filnamnet innehåller ogiltiga tecken",
    };
  }
  return { valid: true };
}

/**
 * Saniterar filnamn genom att ersätta osäkra tecken
 */
export function sanitizeFilename(filename: string, maxLength: number = 100): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "_") // Ersätt osäkra tecken med underscore
    .substring(0, maxLength) // Begränsa längd
    .toLowerCase();
}

/**
 * Komplett filvalidering för bokföringsbilagor
 */
export function validateFile(
  file: File,
  maxSize: number = MAX_FILE_SIZES.image
): { valid: boolean; error?: string } {
  // Kontrollera filstorlek
  const sizeCheck = validateFileSize(file.size, maxSize);
  if (!sizeCheck.valid) return sizeCheck;

  // Kontrollera filtyp
  const typeCheck = validateFileType(file.type);
  if (!typeCheck.valid) return typeCheck;

  // Kontrollera filnamn
  const nameCheck = validateFilename(file.name);
  if (!nameCheck.valid) return nameCheck;

  return { valid: true };
}

/**
 * Validerar SIE-filtyp
 */
export function validateSieFileType(type: string): { valid: boolean; error?: string } {
  const validTypes = [
    "text/plain",
    "application/octet-stream",
    "application/x-sie",
    "", // Tomma typer accepteras också
  ];

  if (!validTypes.includes(type)) {
    return {
      valid: false,
      error: `Ogiltig filtyp: ${type}. Endast SIE-filer är tillåtna.`,
    };
  }

  return { valid: true };
}
