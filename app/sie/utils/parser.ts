/**
 * SIE Format Parser
 * Parsar SIE-filer (Standard Import Export) enligt SIE 4-standarden
 */

import type { SieData, Verification, Transaction } from "../types/types";

/**
 * Parsar SIE-filinnehåll och extraherar strukturerad data
 * @param content - Textinnehåll från SIE-fil
 * @returns Strukturerad SieData med header, konton, verifikationer, balanser och resultat
 */
export function parseSieContent(content: string): SieData {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const result: SieData = {
    header: {
      program: "",
      organisationsnummer: "",
      företagsnamn: "",
      räkenskapsår: [],
      kontoplan: "",
    },
    konton: [],
    verifikationer: [],
    balanser: {
      ingående: [],
      utgående: [],
    },
    resultat: [],
  };

  let currentVerification: Omit<Verification, "transaktioner"> | null = null;
  let currentTransactions: Transaction[] = [];

  for (const line of lines) {
    // Extrahera värden inom citattecken och utan
    const extractValue = (line: string, keyword: string): string => {
      const match = line.match(new RegExp(`#${keyword}\\s+"([^"]+)"|#${keyword}\\s+([^\\s]+)`));
      return match ? match[1] || match[2] || "" : "";
    };

    const extractValues = (line: string, keyword: string): string[] => {
      const regex = new RegExp(`#${keyword}\\s+(.+)`);
      const match = line.match(regex);
      if (!match) return [];

      const values: string[] = [];
      const current = match[1];
      let inQuotes = false;
      let currentValue = "";

      for (let i = 0; i < current.length; i++) {
        const char = current[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === " " && !inQuotes) {
          if (currentValue.trim()) {
            values.push(currentValue.trim());
            currentValue = "";
          }
        } else {
          currentValue += char;
        }
      }
      if (currentValue.trim()) {
        values.push(currentValue.trim());
      }

      return values;
    };

    // Parsa header-information
    if (line.startsWith("#PROGRAM")) {
      result.header.program = extractValue(line, "PROGRAM");
    } else if (line.startsWith("#ORGNR")) {
      result.header.organisationsnummer = extractValue(line, "ORGNR");
    } else if (line.startsWith("#FNAMN")) {
      result.header.företagsnamn = extractValue(line, "FNAMN");
    } else if (line.startsWith("#KPTYP")) {
      result.header.kontoplan = extractValue(line, "KPTYP");
    } else if (line.startsWith("#RAR")) {
      const values = extractValues(line, "RAR");
      if (values.length >= 3) {
        result.header.räkenskapsår.push({
          år: parseInt(values[0]),
          startdatum: values[1],
          slutdatum: values[2],
        });
      }
    }

    // Parsa konton
    else if (line.startsWith("#KONTO")) {
      const values = extractValues(line, "KONTO");
      if (values.length >= 2) {
        result.konton.push({
          nummer: values[0],
          namn: values[1].replace(/"/g, ""),
        });
      }
    }

    // Parsa ingående balanser
    else if (line.startsWith("#IB")) {
      const values = extractValues(line, "IB");
      if (values.length >= 3) {
        const år = parseInt(values[0]);
        const konto = values[1];
        const belopp = parseFloat(values[2]);

        // Visa bara aktuellt år (0) för tydlighet
        if (år === 0) {
          result.balanser.ingående.push({ konto, belopp });
        }
      }
    }

    // Parsa utgående balanser
    else if (line.startsWith("#UB")) {
      const values = extractValues(line, "UB");
      if (values.length >= 3) {
        const år = parseInt(values[0]);
        const konto = values[1];
        const belopp = parseFloat(values[2]);

        // Visa bara aktuellt år (0) för tydlighet
        if (år === 0) {
          result.balanser.utgående.push({ konto, belopp });
        }
      }
    }

    // Parsa resultatposter
    else if (line.startsWith("#RES")) {
      const values = extractValues(line, "RES");
      if (values.length >= 3) {
        const år = parseInt(values[0]);
        const konto = values[1];
        const belopp = parseFloat(values[2]);

        // Visa bara aktuellt år (0) för tydlighet
        if (år === 0) {
          result.resultat.push({ konto, belopp });
        }
      }
    }

    // Parsa verifikationer
    else if (line.startsWith("#VER")) {
      if (currentVerification) {
        // Avsluta föregående verifikation
        result.verifikationer.push({
          ...currentVerification,
          transaktioner: currentTransactions,
        });
      }

      const values = extractValues(line, "VER");
      if (values.length >= 4) {
        currentVerification = {
          serie: values[0].replace(/"/g, ""),
          nummer: values[1].replace(/"/g, ""),
          datum: values[2],
          beskrivning: values[3].replace(/"/g, ""),
        };
        currentTransactions = [];
      }
    }

    // Parsa transaktioner inom verifikationer
    else if (line.startsWith("#TRANS") && currentVerification) {
      const values = extractValues(line, "TRANS");
      if (values.length >= 3) {
        const belopp = parseFloat(values[2]);

        // Debug-logg för G:12 specifikt
        if (currentVerification.serie === "G" && currentVerification.nummer === "12") {
          console.log(`🔍 G:12 #TRANS parse:`, {
            line: line,
            values: values,
            konto: values[0],
            beloppString: values[2],
            beloppParsed: belopp,
            isNaN: isNaN(belopp),
          });
        }

        currentTransactions.push({
          konto: values[0],
          belopp: belopp,
        });
      }
    }
  }

  // Lägg till sista verifikationen
  if (currentVerification) {
    result.verifikationer.push({
      ...currentVerification,
      transaktioner: currentTransactions,
    });
  }

  return result;
}
