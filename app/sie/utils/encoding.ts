import type { SieDiagnosticEntry, DecodeSieFileOptions, SieDecodingResult } from "../types/types";

const DEFAULT_ENCODINGS = ["utf-8", "iso-8859-1", "windows-1252", "cp850"] as const;

function decodeWithEncoding(uint8Array: Uint8Array, encoding: string) {
  const decoder = new TextDecoder(encoding, { fatal: false });
  return decoder.decode(uint8Array);
}

function normaliseContent(content: string) {
  return content
    .replace(/â€™/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€\u009d/g, '"')
    .replace(/â€"/g, "–")
    .replace(/â€"/g, "—")
    .replace(/Ã¤/g, "ä")
    .replace(/Ã¥/g, "å")
    .replace(/Ã¶/g, "ö")
    .replace(/Ã„/g, "Ä")
    .replace(/Ã…/g, "Å")
    .replace(/Ã–/g, "Ö")
    .replace(/™/g, "ö")
    .replace(/„/g, "ä")
    .replace(/†/g, "å")
    .replace(/"/g, "ä")
    .replace(/'/g, "å")
    .replace(/�/g, "");
}

export function decodeSieFile(
  arrayBuffer: ArrayBuffer,
  options: DecodeSieFileOptions = {}
): SieDecodingResult {
  const { debug = false, encodings = DEFAULT_ENCODINGS } = options;
  const diagnostics: SieDiagnosticEntry[] = [];

  const uint8Array = new Uint8Array(arrayBuffer);
  let content = "";
  let encodingUsed = "utf-8";
  let formatTag: string | undefined;

  const quickDecoder = new TextDecoder("utf-8", { fatal: false });
  const quickTest = quickDecoder.decode(uint8Array.slice(0, Math.min(500, uint8Array.length)));
  if (debug) {
    diagnostics.push({ message: "Quick UTF-8 sample", data: quickTest });
  }

  const formatMatch = quickTest.match(/#FORMAT\s+(\w+)/);
  if (formatMatch) {
    formatTag = formatMatch[1].toUpperCase();
    diagnostics.push({ message: "FORMAT tag detected", data: formatTag });

    if (formatTag === "PC8") {
      try {
        content = decodeWithEncoding(uint8Array, "cp850");
        encodingUsed = "cp850";
        diagnostics.push({ message: "Forced CP850 decoding due to PC8 format" });
      } catch (error) {
        diagnostics.push({ message: "CP850 decoding failed", data: error });
      }
    }
  } else {
    diagnostics.push({ message: "No FORMAT tag detected" });
  }

  if (!content) {
    let bestScore = Number.NEGATIVE_INFINITY;

    for (const encoding of encodings) {
      try {
        const decoded = decodeWithEncoding(uint8Array, encoding);

        let score = 0;
        if (decoded.includes("#KONTO") || decoded.includes("#FNAMN")) {
          score += 100;
        }

        const replacementCharCount = (decoded.match(/�/g) || []).length;
        score -= replacementCharCount * 10;

        const weirdCharCount = (decoded.match(/[™„†"']/g) || []).length;
        score -= weirdCharCount * 5;

        const swedishCharCount = (decoded.match(/[äåöÄÅÖ]/g) || []).length;
        score += swedishCharCount * 2;

        if (debug) {
          diagnostics.push({
            message: `Encoding score`,
            data: { encoding, score, replacementCharCount, weirdCharCount, swedishCharCount },
          });
        }

        if (score > bestScore) {
          bestScore = score;
          content = decoded;
          encodingUsed = encoding;
        }
      } catch (error) {
        diagnostics.push({ message: `Encoding ${encoding} failed`, data: error });
      }
    }
  }

  if (!content) {
    content = decodeWithEncoding(uint8Array, "utf-8");
    encodingUsed = "utf-8";
    diagnostics.push({ message: "Fallback to UTF-8" });
  }

  const normalised = normaliseContent(content);
  if (normalised !== content) {
    diagnostics.push({ message: "Applied character normalisation" });
  }

  return {
    content: normalised,
    encoding: encodingUsed,
    formatTag,
    diagnostics,
  };
}
