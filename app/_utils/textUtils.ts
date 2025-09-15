/**
 * Normaliserar text för sökning och matchning
 * Gör text lowercase, tar bort endast kritiskt farliga tecken, normaliserar whitespace
 */
export const normalize = (s: string): string => {
  if (!s || typeof s !== "string") return "";
  return s
    .toLowerCase()
    .replace(/[<>\x00-\x1f\x7f`$\\]/g, "") // XSS + control chars + template injection
    .replace(/\s+/g, " ") // Normalisera whitespace
    .trim()
    .substring(0, 100); // Begränsa längd
};

/**
 * Escapar input för XSS-skydd
 * Tar bort endast de mest kritiska script-farliga tecknen
 */
export const escapeInput = (s: string): string => {
  if (!s || typeof s !== "string") return "";
  return s.replace(/[<>]/g, ""); // Bara XSS-kritiska tecken
};
