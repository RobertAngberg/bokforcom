/**
 * Manual CP850 (DOS Latin-1) decoder
 * CP850 är en MS-DOS codepage som används i skandinaviska länder.
 * Denna decoder mappar byte-värden 128-255 till Unicode-tecken.
 */

// CP850 character map för byte-värden 128-255
const CP850_TO_UNICODE: Record<number, string> = {
  0x80: "Ç",
  0x81: "ü",
  0x82: "é",
  0x83: "â",
  0x84: "ä",
  0x85: "à",
  0x86: "å",
  0x87: "ç",
  0x88: "ê",
  0x89: "ë",
  0x8a: "è",
  0x8b: "ï",
  0x8c: "î",
  0x8d: "ì",
  0x8e: "Ä",
  0x8f: "Å",
  0x90: "É",
  0x91: "æ",
  0x92: "Æ",
  0x93: "ô",
  0x94: "ö",
  0x95: "ò",
  0x96: "û",
  0x97: "ù",
  0x98: "ÿ",
  0x99: "Ö",
  0x9a: "Ü",
  0x9b: "ø",
  0x9c: "£",
  0x9d: "Ø",
  0x9e: "×",
  0x9f: "ƒ",
  0xa0: "á",
  0xa1: "í",
  0xa2: "ó",
  0xa3: "ú",
  0xa4: "ñ",
  0xa5: "Ñ",
  0xa6: "ª",
  0xa7: "º",
  0xa8: "¿",
  0xa9: "®",
  0xaa: "¬",
  0xab: "½",
  0xac: "¼",
  0xad: "¡",
  0xae: "«",
  0xaf: "»",
  0xb0: "░",
  0xb1: "▒",
  0xb2: "▓",
  0xb3: "│",
  0xb4: "┤",
  0xb5: "Á",
  0xb6: "Â",
  0xb7: "À",
  0xb8: "©",
  0xb9: "╣",
  0xba: "║",
  0xbb: "╗",
  0xbc: "╝",
  0xbd: "¢",
  0xbe: "¥",
  0xbf: "┐",
  0xc0: "└",
  0xc1: "┴",
  0xc2: "┬",
  0xc3: "├",
  0xc4: "─",
  0xc5: "┼",
  0xc6: "ã",
  0xc7: "Ã",
  0xc8: "╚",
  0xc9: "╔",
  0xca: "╩",
  0xcb: "╦",
  0xcc: "╠",
  0xcd: "═",
  0xce: "╬",
  0xcf: "¤",
  0xd0: "ð",
  0xd1: "Ð",
  0xd2: "Ê",
  0xd3: "Ë",
  0xd4: "È",
  0xd5: "ı",
  0xd6: "Í",
  0xd7: "Î",
  0xd8: "Ï",
  0xd9: "┘",
  0xda: "┌",
  0xdb: "█",
  0xdc: "▄",
  0xdd: "¦",
  0xde: "Ì",
  0xdf: "▀",
  0xe0: "Ó",
  0xe1: "ß",
  0xe2: "Ô",
  0xe3: "Ò",
  0xe4: "õ",
  0xe5: "Õ",
  0xe6: "µ",
  0xe7: "þ",
  0xe8: "Þ",
  0xe9: "Ú",
  0xea: "Û",
  0xeb: "Ù",
  0xec: "ý",
  0xed: "Ý",
  0xee: "¯",
  0xef: "´",
  0xf0: "­",
  0xf1: "±",
  0xf2: "‗",
  0xf3: "¾",
  0xf4: "¶",
  0xf5: "§",
  0xf6: "÷",
  0xf7: "¸",
  0xf8: "°",
  0xf9: "¨",
  0xfa: "·",
  0xfb: "¹",
  0xfc: "³",
  0xfd: "²",
  0xfe: "■",
  0xff: " ",
};

/**
 * Decodes a CP850 encoded byte array to a UTF-8 string.
 * @param uint8Array - The CP850 encoded byte array
 * @returns The decoded string
 */
export function decodeCP850(uint8Array: Uint8Array): string {
  let result = "";

  for (let i = 0; i < uint8Array.length; i++) {
    const byte = uint8Array[i];

    if (byte < 128) {
      // ASCII-området (0-127) är samma i alla encodings
      result += String.fromCharCode(byte);
    } else {
      // Använd mappningstabellen för byte 128-255
      result += CP850_TO_UNICODE[byte] || "?";
    }
  }

  return result;
}

/**
 * Checks if a byte array is likely CP850 encoded by looking for common patterns.
 * @param uint8Array - The byte array to check
 * @returns true if likely CP850 encoded
 */
export function isLikelyCP850(uint8Array: Uint8Array): boolean {
  // Kolla efter typiska CP850 byte-värden för svenska tecken
  const sample = uint8Array.slice(0, Math.min(1000, uint8Array.length));
  let cp850Indicators = 0;

  for (const byte of sample) {
    // Typiska CP850 bytes för svenska tecken
    if (
      byte === 0x84 ||
      byte === 0x86 ||
      byte === 0x8e ||
      byte === 0x8f ||
      byte === 0x94 ||
      byte === 0x99
    ) {
      cp850Indicators++;
    }
  }

  return cp850Indicators > 0;
}
