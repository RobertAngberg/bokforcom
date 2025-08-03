"use server";

interface SieData {
  header: {
    program: string;
    organisationsnummer: string;
    företagsnamn: string;
    räkenskapsår: Array<{ år: number; startdatum: string; slutdatum: string }>;
    kontoplan: string;
  };
  konton: Array<{
    nummer: string;
    namn: string;
  }>;
  verifikationer: Array<{
    serie: string;
    nummer: string;
    datum: string;
    beskrivning: string;
    transaktioner: Array<{
      konto: string;
      belopp: number;
    }>;
  }>;
  balanser: {
    ingående: Array<{ konto: string; belopp: number }>;
    utgående: Array<{ konto: string; belopp: number }>;
  };
  resultat: Array<{ konto: string; belopp: number }>;
}

export async function uploadSieFile(
  formData: FormData
): Promise<{ success: boolean; data?: SieData; error?: string }> {
  try {
    const file = formData.get("file") as File;

    if (!file) {
      return { success: false, error: "Ingen fil vald" };
    }

    if (
      !file.name.toLowerCase().endsWith(".se4") &&
      !file.name.toLowerCase().endsWith(".sie") &&
      !file.name.toLowerCase().endsWith(".se")
    ) {
      return { success: false, error: "Endast SIE-filer (.sie, .se4, .se) stöds" };
    }

    // Läs filinnehållet
    const arrayBuffer = await file.arrayBuffer();
    let content: string = "";

    // Prova olika encodings för svenska tecken
    const uint8Array = new Uint8Array(arrayBuffer);

    // Försök med vanligaste encodings för SIE-filer
    const encodings = ["iso-8859-1", "windows-1252", "utf-8"];
    let bestContent = "";

    for (const encoding of encodings) {
      try {
        const decoder = new TextDecoder(encoding);
        const testContent = decoder.decode(uint8Array);

        // Kolla om denna encoding gav rimligt resultat
        if (testContent.includes("#KONTO") || testContent.includes("#FNAMN")) {
          content = testContent;
          console.log(`✅ Använder encoding: ${encoding}`);
          break;
        } else {
          bestContent = testContent; // Spara som backup
        }
      } catch (error) {
        console.log(`❌ Encoding ${encoding} misslyckades:`, error);
      }
    }

    // Om inget funkade, använd bästa försöket
    if (!content) {
      content = bestContent || new TextDecoder("utf-8").decode(uint8Array);
      console.log("🔄 Använder fallback encoding");
    }

    // Förbättrad encoding-hantering för svenska tecken
    // Hantera olika encoding-varianter som kan förekomma
    content = content
      // Standard replacement characters
      .replace(/�/g, "ä")
      .replace(/�/g, "å")
      .replace(/�/g, "ö")
      .replace(/�/g, "Ä")
      .replace(/�/g, "Å")
      .replace(/�/g, "Ö")
      // CP850 mappings
      .replace(/\x84/g, "ä") // CP850 ä
      .replace(/\x86/g, "å") // CP850 å
      .replace(/\x94/g, "ö") // CP850 ö
      .replace(/\x8E/g, "Ä") // CP850 Ä
      .replace(/\x8F/g, "Å") // CP850 Å
      .replace(/\x99/g, "Ö") // CP850 Ö
      // ISO-8859-1 mappings
      .replace(/\xE4/g, "ä") // ISO-8859-1 ä
      .replace(/\xE5/g, "å") // ISO-8859-1 å
      .replace(/\xF6/g, "ö") // ISO-8859-1 ö
      .replace(/\xC4/g, "Ä") // ISO-8859-1 Ä
      .replace(/\xC5/g, "Å") // ISO-8859-1 Å
      .replace(/\xD6/g, "Ö") // ISO-8859-1 Ö
      // Windows-1252 mappings (liknande ISO-8859-1)
      .replace(/\u00E4/g, "ä")
      .replace(/\u00E5/g, "å")
      .replace(/\u00F6/g, "ö")
      .replace(/\u00C4/g, "Ä")
      .replace(/\u00C5/g, "Å")
      .replace(/\u00D6/g, "Ö");

    // Debug: logga de första raderna för att se encoding-status
    console.log("🔍 SIE-fil encoding test:", content.substring(0, 200));

    // Parsa SIE-data
    const sieData = parseSieContent(content);

    return { success: true, data: sieData };
  } catch (error) {
    console.error("Fel vid parsning av SIE-fil:", error);
    return { success: false, error: "Kunde inte läsa SIE-filen" };
  }
}

function parseSieContent(content: string): SieData {
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

  let currentVerification: any = null;
  let currentTransactions: any[] = [];

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

      const values = [];
      let current = match[1];
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
        currentTransactions.push({
          konto: values[0],
          belopp: parseFloat(values[2]),
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
