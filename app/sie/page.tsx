"use client";

import { useState, useEffect } from "react";
import MainLayout from "../_components/MainLayout";
import Knapp from "../_components/Knapp";
import KnappFullWidth from "../_components/KnappFullWidth";
import {
  uploadSieFile,
  exporteraSieData,
  skapaKonton,
  importeraSieData,
  rensaDubblettkonton,
} from "./actions";

// CP850 (Code Page 850) till Unicode mapping för svenska tecken
const CP850_TO_UNICODE: { [key: number]: string } = {
  // Standard ASCII tecken 0-127 mappas direkt
  // Här är bara de viktiga svenska tecknen och andra tecken över 127
  128: "Ç",
  129: "ü",
  130: "é",
  131: "â",
  132: "ä",
  133: "à",
  134: "å",
  135: "ç",
  136: "ê",
  137: "ë",
  138: "è",
  139: "ï",
  140: "î",
  141: "ì",
  142: "Ä",
  143: "Å",
  144: "É",
  145: "æ",
  146: "Æ",
  147: "ô",
  148: "ö",
  149: "ò",
  150: "û",
  151: "ù",
  152: "ÿ",
  153: "Ö",
  154: "Ü",
  155: "ø",
  156: "£",
  157: "Ø",
  158: "×",
  159: "ƒ",
  160: "á",
  161: "í",
  162: "ó",
  163: "ú",
  164: "ñ",
  165: "Ñ",
  166: "ª",
  167: "º",
  168: "¿",
  169: "®",
  170: "¬",
  171: "½",
  172: "¼",
  173: "¡",
  174: "«",
  175: "»",
  176: "░",
  177: "▒",
  178: "▓",
  179: "│",
  180: "┤",
  181: "Á",
  182: "Â",
  183: "À",
  184: "©",
  185: "╣",
  186: "║",
  187: "╗",
  188: "╝",
  189: "¢",
  190: "¥",
  191: "┐",
  192: "└",
  193: "┴",
  194: "┬",
  195: "├",
  196: "─",
  197: "┼",
  198: "ã",
  199: "Ã",
  200: "╚",
  201: "╔",
  202: "╩",
  203: "╦",
  204: "╠",
  205: "═",
  206: "╬",
  207: "¤",
  208: "ð",
  209: "Ð",
  210: "Ê",
  211: "Ë",
  212: "È",
  213: "ı",
  214: "Í",
  215: "Î",
  216: "Ï",
  217: "┘",
  218: "┌",
  219: "█",
  220: "▄",
  221: "¦",
  222: "Ì",
  223: "▀",
  224: "Ó",
  225: "ß",
  226: "Ô",
  227: "Ò",
  228: "õ",
  229: "Õ",
  230: "µ",
  231: "þ",
  232: "Þ",
  233: "Ú",
  234: "Û",
  235: "Ù",
  236: "ý",
  237: "Ý",
  238: "¯",
  239: "´",
  240: "­",
  241: "±",
  242: "‗",
  243: "¾",
  244: "¶",
  245: "§",
  246: "÷",
  247: "¸",
  248: "°",
  249: "¨",
  250: "·",
  251: "¹",
  252: "³",
  253: "²",
  254: "■",
  255: " ",
};

// Dekoda CP850 bytes till Unicode string
const decodeCP850 = (bytes: Uint8Array): string => {
  let result = "";
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    if (byte < 128) {
      // Standard ASCII
      result += String.fromCharCode(byte);
    } else {
      // Använd CP850 mapping
      result += CP850_TO_UNICODE[byte] || "?";
    }
  }
  return result;
};

// Frontend validation och parsing utilities
const validateFileSize = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 50 * 1024 * 1024; // 50MB max för SIE-filer
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Filen är för stor (${Math.round(file.size / 1024 / 1024)}MB). Max 50MB tillåtet.`,
    };
  }
  return { valid: true };
};

const sanitizeInput = (input: string): string => {
  return input.replace(/[<>'"&]/g, "").trim();
};

// BAS 2025 standardkonton (grundläggande kontoplan)
const basStandardKonton = new Set([
  "1010",
  "1020",
  "1030",
  "1040",
  "1050",
  "1060",
  "1070",
  "1080",
  "1090",
  "1110",
  "1120",
  "1130",
  "1140",
  "1150",
  "1160",
  "1170",
  "1180",
  "1190",
  "1210",
  "1220",
  "1230",
  "1240",
  "1250",
  "1260",
  "1270",
  "1280",
  "1290",
  "1310",
  "1320",
  "1330",
  "1340",
  "1350",
  "1360",
  "1370",
  "1380",
  "1390",
  "1410",
  "1420",
  "1430",
  "1440",
  "1450",
  "1460",
  "1470",
  "1480",
  "1490",
  "1510",
  "1520",
  "1530",
  "1540",
  "1550",
  "1560",
  "1570",
  "1580",
  "1590",
  "1610",
  "1620",
  "1630",
  "1640",
  "1650",
  "1660",
  "1670",
  "1680",
  "1690",
  "1710",
  "1720",
  "1730",
  "1740",
  "1750",
  "1760",
  "1770",
  "1780",
  "1790",
  "1810",
  "1820",
  "1830",
  "1840",
  "1850",
  "1860",
  "1870",
  "1880",
  "1890",
  "1910",
  "1920",
  "1930",
  "1940",
  "1950",
  "1960",
  "1970",
  "1980",
  "1990",
  "2010",
  "2020",
  "2030",
  "2040",
  "2050",
  "2060",
  "2070",
  "2080",
  "2090",
  "2110",
  "2120",
  "2130",
  "2140",
  "2150",
  "2160",
  "2170",
  "2180",
  "2190",
  "2210",
  "2220",
  "2230",
  "2240",
  "2250",
  "2260",
  "2270",
  "2280",
  "2290",
  "2310",
  "2320",
  "2330",
  "2340",
  "2350",
  "2360",
  "2370",
  "2380",
  "2390",
  "2410",
  "2420",
  "2430",
  "2440",
  "2450",
  "2460",
  "2470",
  "2480",
  "2490",
  "2510",
  "2520",
  "2530",
  "2540",
  "2550",
  "2560",
  "2570",
  "2580",
  "2590",
  "2610",
  "2620",
  "2630",
  "2640",
  "2650",
  "2660",
  "2670",
  "2680",
  "2690",
  "2710",
  "2720",
  "2730",
  "2740",
  "2750",
  "2760",
  "2770",
  "2780",
  "2790",
  "2810",
  "2820",
  "2830",
  "2840",
  "2850",
  "2860",
  "2870",
  "2880",
  "2890",
  "2910",
  "2920",
  "2930",
  "2940",
  "2950",
  "2960",
  "2970",
  "2980",
  "2990",
  "3010",
  "3020",
  "3030",
  "3040",
  "3050",
  "3060",
  "3070",
  "3080",
  "3090",
  "3110",
  "3120",
  "3130",
  "3140",
  "3150",
  "3160",
  "3170",
  "3180",
  "3190",
  "3210",
  "3220",
  "3230",
  "3240",
  "3250",
  "3260",
  "3270",
  "3280",
  "3290",
  "3310",
  "3320",
  "3330",
  "3340",
  "3350",
  "3360",
  "3370",
  "3380",
  "3390",
  "3410",
  "3420",
  "3430",
  "3440",
  "3450",
  "3460",
  "3470",
  "3480",
  "3490",
  "3510",
  "3520",
  "3530",
  "3540",
  "3550",
  "3560",
  "3570",
  "3580",
  "3590",
  "3610",
  "3620",
  "3630",
  "3640",
  "3650",
  "3660",
  "3670",
  "3680",
  "3690",
  "3710",
  "3720",
  "3730",
  "3740",
  "3750",
  "3760",
  "3770",
  "3780",
  "3790",
  "3810",
  "3820",
  "3830",
  "3840",
  "3850",
  "3860",
  "3870",
  "3880",
  "3890",
  "3910",
  "3920",
  "3930",
  "3940",
  "3950",
  "3960",
  "3970",
  "3980",
  "3990",
  "4010",
  "4020",
  "4030",
  "4040",
  "4050",
  "4060",
  "4070",
  "4080",
  "4090",
  "4110",
  "4120",
  "4130",
  "4140",
  "4150",
  "4160",
  "4170",
  "4180",
  "4190",
  "4210",
  "4220",
  "4230",
  "4240",
  "4250",
  "4260",
  "4270",
  "4280",
  "4290",
  "4310",
  "4320",
  "4330",
  "4340",
  "4350",
  "4360",
  "4370",
  "4380",
  "4390",
  "4410",
  "4420",
  "4430",
  "4440",
  "4450",
  "4460",
  "4470",
  "4480",
  "4490",
  "4510",
  "4520",
  "4530",
  "4540",
  "4550",
  "4560",
  "4570",
  "4580",
  "4590",
  "4610",
  "4620",
  "4630",
  "4640",
  "4650",
  "4660",
  "4670",
  "4680",
  "4690",
  "4710",
  "4720",
  "4730",
  "4740",
  "4750",
  "4760",
  "4770",
  "4780",
  "4790",
  "4810",
  "4820",
  "4830",
  "4840",
  "4850",
  "4860",
  "4870",
  "4880",
  "4890",
  "4910",
  "4920",
  "4930",
  "4940",
  "4950",
  "4960",
  "4970",
  "4980",
  "4990",
  "5010",
  "5020",
  "5030",
  "5040",
  "5050",
  "5060",
  "5070",
  "5080",
  "5090",
  "5110",
  "5120",
  "5130",
  "5140",
  "5150",
  "5160",
  "5170",
  "5180",
  "5190",
  "5210",
  "5220",
  "5230",
  "5240",
  "5250",
  "5260",
  "5270",
  "5280",
  "5290",
  "5310",
  "5320",
  "5330",
  "5340",
  "5350",
  "5360",
  "5370",
  "5380",
  "5390",
  "5410",
  "5420",
  "5430",
  "5440",
  "5450",
  "5460",
  "5470",
  "5480",
  "5490",
  "5510",
  "5520",
  "5530",
  "5540",
  "5550",
  "5560",
  "5570",
  "5580",
  "5590",
  "5610",
  "5620",
  "5630",
  "5640",
  "5650",
  "5660",
  "5670",
  "5680",
  "5690",
  "5710",
  "5720",
  "5730",
  "5740",
  "5750",
  "5760",
  "5770",
  "5780",
  "5790",
  "5810",
  "5820",
  "5830",
  "5840",
  "5850",
  "5860",
  "5870",
  "5880",
  "5890",
  "5910",
  "5920",
  "5930",
  "5940",
  "5950",
  "5960",
  "5970",
  "5980",
  "5990",
  "6010",
  "6020",
  "6030",
  "6040",
  "6050",
  "6060",
  "6070",
  "6080",
  "6090",
  "6110",
  "6120",
  "6130",
  "6140",
  "6150",
  "6160",
  "6170",
  "6180",
  "6190",
  "6210",
  "6220",
  "6230",
  "6240",
  "6250",
  "6260",
  "6270",
  "6280",
  "6290",
  "6310",
  "6320",
  "6330",
  "6340",
  "6350",
  "6360",
  "6370",
  "6380",
  "6390",
  "6410",
  "6420",
  "6430",
  "6440",
  "6450",
  "6460",
  "6470",
  "6480",
  "6490",
  "6510",
  "6520",
  "6530",
  "6540",
  "6550",
  "6560",
  "6570",
  "6580",
  "6590",
  "6610",
  "6620",
  "6630",
  "6640",
  "6650",
  "6660",
  "6670",
  "6680",
  "6690",
  "6710",
  "6720",
  "6730",
  "6740",
  "6750",
  "6760",
  "6770",
  "6780",
  "6790",
  "6810",
  "6820",
  "6830",
  "6840",
  "6850",
  "6860",
  "6870",
  "6880",
  "6890",
  "6910",
  "6920",
  "6930",
  "6940",
  "6950",
  "6960",
  "6970",
  "6980",
  "6990",
  "7010",
  "7020",
  "7030",
  "7040",
  "7050",
  "7060",
  "7070",
  "7080",
  "7090",
  "7110",
  "7120",
  "7130",
  "7140",
  "7150",
  "7160",
  "7170",
  "7180",
  "7190",
  "7210",
  "7220",
  "7230",
  "7240",
  "7250",
  "7260",
  "7270",
  "7280",
  "7290",
  "7310",
  "7320",
  "7330",
  "7340",
  "7350",
  "7360",
  "7370",
  "7380",
  "7390",
  "7410",
  "7420",
  "7430",
  "7440",
  "7450",
  "7460",
  "7470",
  "7480",
  "7490",
  "7510",
  "7520",
  "7530",
  "7540",
  "7550",
  "7560",
  "7570",
  "7580",
  "7590",
  "7610",
  "7620",
  "7630",
  "7640",
  "7650",
  "7660",
  "7670",
  "7680",
  "7690",
  "7710",
  "7720",
  "7730",
  "7740",
  "7750",
  "7760",
  "7770",
  "7780",
  "7790",
  "7810",
  "7820",
  "7830",
  "7840",
  "7850",
  "7860",
  "7870",
  "7880",
  "7890",
  "7910",
  "7920",
  "7930",
  "7940",
  "7950",
  "7960",
  "7970",
  "7980",
  "7990",
  "8010",
  "8020",
  "8030",
  "8040",
  "8050",
  "8060",
  "8070",
  "8080",
  "8090",
  "8110",
  "8120",
  "8130",
  "8140",
  "8150",
  "8160",
  "8170",
  "8180",
  "8190",
  "8210",
  "8220",
  "8230",
  "8240",
  "8250",
  "8260",
  "8270",
  "8280",
  "8290",
  "8310",
  "8320",
  "8330",
  "8340",
  "8350",
  "8360",
  "8370",
  "8380",
  "8390",
  "8410",
  "8420",
  "8430",
  "8440",
  "8450",
  "8460",
  "8470",
  "8480",
  "8490",
  "8510",
  "8520",
  "8530",
  "8540",
  "8550",
  "8560",
  "8570",
  "8580",
  "8590",
  "8610",
  "8620",
  "8630",
  "8640",
  "8650",
  "8660",
  "8670",
  "8680",
  "8690",
  "8710",
  "8720",
  "8730",
  "8740",
  "8750",
  "8760",
  "8770",
  "8780",
  "8790",
  "8810",
  "8820",
  "8830",
  "8840",
  "8850",
  "8860",
  "8870",
  "8880",
  "8890",
  "8910",
  "8920",
  "8930",
  "8940",
  "8950",
  "8960",
  "8970",
  "8980",
  "8990",
  "8999",
]);

// SIE parsing functions flyttade från server
const parseSieContent = (content: string): SieData => {
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

  const extractValue = (line: string, keyword: string): string => {
    const match = line.match(new RegExp(`#${keyword}\\s+"([^"]+)"|#${keyword}\\s+([^\\s]+)`));
    return match ? match[1] || match[2] || "" : "";
  };

  const extractValues = (line: string, keyword: string): string[] => {
    const regex = new RegExp(`#${keyword}\\s+(.+)`);
    const match = line.match(regex);
    if (!match) return [];

    const values: string[] = [];
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

  for (const line of lines) {
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

        if (år === 0) {
          result.resultat.push({ konto, belopp });
        }
      }
    }

    // Parsa verifikationer
    else if (line.startsWith("#VER")) {
      if (currentVerification) {
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
};

// Analyze missing accounts frontend
const analyzeAccounts = (sieKonton: string[], anvandaKonton: string[]) => {
  // Separera mellan standard BAS-konton och specialkonton
  const standardKonton = sieKonton.filter((konto) => basStandardKonton.has(konto));
  const specialKonton = sieKonton.filter((konto) => !basStandardKonton.has(konto));

  // Kritiska konton som bör finnas - endast RIKTIGT företagsspecifika konton SOM OCKSÅ ANVÄNDS
  const kritiskaKonton = specialKonton.filter((konto) => {
    // Hoppa över konton som inte används
    if (!anvandaKonton.includes(konto)) return false;

    const kontoNum = parseInt(konto);

    // Konton längre än 4 siffror är nästan alltid företagsspecifika
    if (konto.length > 4) return true;

    // Konton utanför BAS-intervall
    if (kontoNum < 1000) return true;
    if (kontoNum > 9000 && kontoNum < 9900) return true;
    if (kontoNum > 9999) return true;

    return false;
  });

  return {
    totaltAntal: sieKonton.length,
    standardKonton: standardKonton.length,
    specialKonton: specialKonton.length,
    kritiskaKonton: kritiskaKonton,
    anvandaSaknade: specialKonton.filter((konto) => anvandaKonton.includes(konto)).length,
    totaltAnvanda: anvandaKonton.length,
  };
};

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

interface Analys {
  totaltAntal: number;
  standardKonton: number;
  specialKonton: number;
  kritiskaKonton: string[];
  anvandaSaknade: number;
  totaltAnvanda: number;
}

type WizardStep = "konton" | "inställningar" | "förhandsvisning" | "import" | "resultat";

// Wizard-komponenter
function ImportWizard({
  sieData,
  saknadeKonton,
  analys,
  onCancel,
  selectedFile,
}: {
  sieData: SieData;
  saknadeKonton: string[];
  analys: Analys;
  onCancel: () => void;
  selectedFile?: File | null;
}) {
  const [currentStep, setCurrentStep] = useState<WizardStep>("konton");
  const [importResultat, setImportResultat] = useState<any>(null);
  const [rensarDubbletter, setRensarDubbletter] = useState(false);
  const [dublettResultat, setDublettResultat] = useState<any>(null);
  const [importSettings, setImportSettings] = useState({
    startDatum: "",
    slutDatum: "",
    inkluderaVerifikationer: true,
    inkluderaBalanser: true,
    inkluderaResultat: true,
    skapaKonton: true,
    exkluderaVerifikationer: [] as string[], // Array av verifikationsnummer att skippa
  });

  // Förfyll datumen automatiskt baserat på SIE-data
  useEffect(() => {
    if (sieData.verifikationer.length > 0 && !importSettings.startDatum) {
      const tidigasteDatum = sieData.verifikationer.reduce(
        (earliest, v) => (v.datum < earliest ? v.datum : earliest),
        sieData.verifikationer[0].datum
      );
      const senasteDatum = sieData.verifikationer.reduce(
        (latest, v) => (v.datum > latest ? v.datum : latest),
        sieData.verifikationer[0].datum
      );

      // Konvertera från YYYYMMDD till YYYY-MM-DD format
      const formatDatum = (datum: string) => {
        if (datum.length === 8) {
          return `${datum.slice(0, 4)}-${datum.slice(4, 6)}-${datum.slice(6, 8)}`;
        }
        return datum;
      };

      setImportSettings((prev) => ({
        ...prev,
        startDatum: formatDatum(tidigasteDatum),
        slutDatum: formatDatum(senasteDatum),
      }));
    }
  }, [sieData, importSettings.startDatum]);

  // Funktion för att rensa dubbletter
  const handleRensaDubbletter = async () => {
    setRensarDubbletter(true);
    setDublettResultat(null);

    try {
      const resultat = await rensaDubblettkonton();
      setDublettResultat(resultat);

      if (resultat.success) {
        console.log(`✅ Rensade ${resultat.rensade} dubbletter`);
      } else {
        console.error("❌ Kunde inte rensa dubbletter:", resultat.error);
      }
    } catch (error) {
      console.error("❌ Fel vid rensning av dubbletter:", error);
      setDublettResultat({
        success: false,
        error: "Okänt fel vid rensning",
      });
    } finally {
      setRensarDubbletter(false);
    }
  };

  const steps = [
    { id: "konton", title: "Kontohantering", description: "Granska och skapa saknade konton" },
    {
      id: "inställningar",
      title: "Importinställningar",
      description: "Välj vad som ska importeras",
    },
    {
      id: "förhandsvisning",
      title: "Förhandsvisning",
      description: "Kontrollera vad som kommer att hända",
    },
    { id: "import", title: "Importera", description: "Utför importen" },
    { id: "resultat", title: "Resultat", description: "Import slutförd" },
  ];

  const currentStepIndex = steps.findIndex((step) => step.id === currentStep);

  return (
    <div className="min-h-screen bg-slate-800 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-slate-700 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">SIE Import-wizard</h1>
            <button onClick={onCancel} className="text-gray-400 hover:text-white transition-colors">
              ✕ Avbryt
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center space-x-4 mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-8 h-8 min-w-[2rem] rounded-full flex items-center justify-center text-sm font-bold ${
                    index < currentStepIndex
                      ? "bg-green-600 text-white"
                      : index === currentStepIndex
                        ? "bg-cyan-600 text-white"
                        : "bg-slate-600 text-gray-400"
                  }`}
                >
                  {index < currentStepIndex ? "✓" : index + 1}
                </div>
                <div className="ml-2">
                  <div
                    className={`text-sm font-medium ${
                      index <= currentStepIndex ? "text-white" : "text-gray-400"
                    }`}
                  >
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-500">{step.description}</div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-8 h-0.5 mx-4 ${
                      index < currentStepIndex ? "bg-green-600" : "bg-slate-600"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-slate-700 rounded-lg p-6">
          {currentStep === "konton" && (
            <KontoSteg
              sieData={sieData}
              saknadeKonton={saknadeKonton}
              analys={analys}
              onNext={() => setCurrentStep("inställningar")}
              rensarDubbletter={rensarDubbletter}
              dublettResultat={dublettResultat}
              onRensaDubbletter={handleRensaDubbletter}
            />
          )}

          {currentStep === "inställningar" && (
            <InställningarSteg
              sieData={sieData}
              settings={importSettings}
              onSettingsChange={setImportSettings}
              onNext={() => setCurrentStep("förhandsvisning")}
              onBack={() => setCurrentStep("konton")}
            />
          )}

          {currentStep === "förhandsvisning" && (
            <FörhandsvisningSteg
              sieData={sieData}
              settings={importSettings}
              onNext={() => setCurrentStep("import")}
              onBack={() => setCurrentStep("inställningar")}
            />
          )}

          {currentStep === "import" && (
            <ImportSteg
              sieData={sieData}
              saknadeKonton={saknadeKonton}
              settings={importSettings}
              selectedFile={selectedFile}
              onComplete={(resultat) => {
                setImportResultat(resultat);
                setCurrentStep("resultat");
              }}
            />
          )}

          {currentStep === "resultat" && (
            <ResultatSteg resultat={importResultat} onFinish={onCancel} />
          )}
        </div>
      </div>
    </div>
  );
}

// Komponent för Steg 1: Kontohantering
function KontoSteg({
  sieData,
  saknadeKonton,
  analys,
  onNext,
  rensarDubbletter,
  dublettResultat,
  onRensaDubbletter,
}: {
  sieData: SieData;
  saknadeKonton: string[];
  analys: Analys;
  onNext: () => void;
  rensarDubbletter: boolean;
  dublettResultat: any;
  onRensaDubbletter: () => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-4">Steg 1: Kontohantering</h2>

      <div className="space-y-4">
        {/* Info om automatisk kontoskapande */}
        <div className="bg-blue-500/20 border border-blue-500 text-blue-400 px-4 py-3 rounded">
          <strong>ℹ️ Smart kontoskapande:</strong> Systemet kommer automatiskt att skapa ALLA
          använda konton som saknas i din kontoplan, inklusive både BAS-standardkonton och
          företagsspecifika konton.
        </div>

        {saknadeKonton.length > 0 ? (
          <div className="space-y-4">
            <div className="bg-yellow-500/20 border border-yellow-500 text-yellow-400 px-4 py-3 rounded">
              <strong>⚠️ Specialkonton att granska:</strong> {saknadeKonton.length}{" "}
              företagsspecifika konton hittades som bör granskas innan import.
            </div>

            <div className="bg-slate-800 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-3">
                Företagsspecifika konton som kommer att skapas:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {saknadeKonton.map((kontonummer) => {
                  const kontoInfo = sieData.konton.find((k) => k.nummer === kontonummer);
                  return (
                    <div key={kontonummer} className="bg-slate-700 rounded-lg p-3">
                      <div className="text-lg font-bold text-white">{kontonummer}</div>
                      {kontoInfo && (
                        <div className="text-gray-300 text-sm mt-1">{kontoInfo.namn}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-green-500/20 border border-green-500 text-green-400 px-4 py-3 rounded">
            ✅ Inga företagsspecifika konton behöver granskas!
          </div>
        )}

        {/* Info om övriga konton */}
        {analys.anvandaSaknade > saknadeKonton.length && (
          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="font-semibold text-white mb-2">📊 Ytterligare kontoskapande</h3>
            <p className="text-gray-300 text-sm">
              Totalt kommer {analys.anvandaSaknade} använda konton att skapas, varav{" "}
              {analys.anvandaSaknade - saknadeKonton.length} är BAS-standardkonton som skapas
              automatiskt utan granskning.
            </p>
          </div>
        )}

        {/* Debugging och dubbletthantering */}
        <div className="bg-slate-800 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-3">🔧 Verktyg och felsökning</h3>

          <div className="space-y-3">
            <div className="text-sm text-gray-300">
              <strong>Kontonummer från SIE-fil (sample):</strong>{" "}
              {saknadeKonton
                .slice(0, 3)
                .map((kontonr) => {
                  const kontoInfo = sieData.konton.find((k) => k.nummer === kontonr);
                  return kontoInfo ? `${kontonr} ("${kontoInfo.namn}")` : kontonr;
                })
                .join(", ")}
              {saknadeKonton.length > 3 && ` + ${saknadeKonton.length - 3} till`}
            </div>

            <div className="flex gap-2">
              <Knapp
                text={rensarDubbletter ? "Rensar..." : "🗑️ Rensa dubbletter"}
                onClick={onRensaDubbletter}
                disabled={rensarDubbletter}
                className="bg-orange-600 hover:bg-orange-700"
              />
            </div>

            {dublettResultat && (
              <div
                className={`p-3 rounded ${
                  dublettResultat.success
                    ? "bg-green-500/20 border border-green-500 text-green-400"
                    : "bg-red-500/20 border border-red-500 text-red-400"
                }`}
              >
                {dublettResultat.success
                  ? `✅ Rensade ${dublettResultat.rensade} dubbletter`
                  : `❌ Fel: ${dublettResultat.error}`}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Knapp text="Fortsätt till inställningar →" onClick={onNext} />
      </div>
    </div>
  );
}

// Komponent för Steg 2: Inställningar
function InställningarSteg({
  sieData,
  settings,
  onSettingsChange,
  onNext,
  onBack,
}: {
  sieData: SieData;
  settings: any;
  onSettingsChange: (settings: any) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const tidigasteDatum =
    sieData.verifikationer.length > 0
      ? sieData.verifikationer.reduce(
          (earliest, v) => (v.datum < earliest ? v.datum : earliest),
          sieData.verifikationer[0].datum
        )
      : "";

  const senasteDatum =
    sieData.verifikationer.length > 0
      ? sieData.verifikationer.reduce(
          (latest, v) => (v.datum > latest ? v.datum : latest),
          sieData.verifikationer[0].datum
        )
      : "";

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-4">Steg 2: Importinställningar</h2>

      <div className="space-y-6">
        {/* Datumintervall */}
        <div className="bg-slate-800 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-3">Datumintervall</h3>
          <div className="bg-blue-500/20 border border-blue-500 text-blue-400 px-4 py-3 rounded mb-3">
            <strong>
              📅 SIE-filen innehåller data från {tidigasteDatum} till {senasteDatum}
            </strong>
            <br />
            <span className="text-sm">
              Datumintervallet nedan är automatiskt förifyllt, men du kan justera det om du bara
              vill importera en del av perioden.
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Från datum</label>
              <input
                type="date"
                value={settings.startDatum}
                onChange={(e) => onSettingsChange({ ...settings, startDatum: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Till datum</label>
              <input
                type="date"
                value={settings.slutDatum}
                onChange={(e) => onSettingsChange({ ...settings, slutDatum: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Vad som ska importeras */}
        <div className="bg-slate-800 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-3">Vad ska importeras?</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.inkluderaVerifikationer}
                onChange={(e) =>
                  onSettingsChange({ ...settings, inkluderaVerifikationer: e.target.checked })
                }
                className="mr-3"
              />
              <span className="text-white">
                Verifikationer ({sieData.verifikationer.length} st)
              </span>
            </label>

            {/* Visa verifikationer för exkludering */}
            {settings.inkluderaVerifikationer && sieData.verifikationer.length > 0 && (
              <div className="ml-6 mt-2 bg-slate-700 rounded p-3">
                <h4 className="text-sm font-medium text-white mb-2">
                  Exkludera specifika verifikationer:
                </h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {sieData.verifikationer.slice(0, 20).map((v) => (
                    <label key={`${v.serie}-${v.nummer}`} className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={settings.exkluderaVerifikationer.includes(
                          `${v.serie}-${v.nummer}`
                        )}
                        onChange={(e) => {
                          const verifikationId = `${v.serie}-${v.nummer}`;
                          const newExkludera = e.target.checked
                            ? [...settings.exkluderaVerifikationer, verifikationId]
                            : settings.exkluderaVerifikationer.filter(
                                (id: string) => id !== verifikationId
                              );
                          onSettingsChange({ ...settings, exkluderaVerifikationer: newExkludera });
                        }}
                        className="mr-2 scale-75"
                      />
                      <span className="text-gray-300">
                        V{v.nummer}: {v.beskrivning} ({v.datum})
                      </span>
                    </label>
                  ))}
                  {sieData.verifikationer.length > 20 && (
                    <p className="text-xs text-gray-400 mt-2">
                      Visar första 20 av {sieData.verifikationer.length} verifikationer
                    </p>
                  )}
                </div>
              </div>
            )}
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.inkluderaBalanser}
                onChange={(e) =>
                  onSettingsChange({ ...settings, inkluderaBalanser: e.target.checked })
                }
                className="mr-3"
              />
              <span className="text-white">Ingående/Utgående balanser</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.inkluderaResultat}
                onChange={(e) =>
                  onSettingsChange({ ...settings, inkluderaResultat: e.target.checked })
                }
                className="mr-3"
              />
              <span className="text-white">Resultatdata</span>
            </label>
          </div>
        </div>

        {/* Avancerade inställningar */}
        <div className="bg-slate-800 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-3">Avancerade inställningar</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.skapaKonton}
                onChange={(e) => onSettingsChange({ ...settings, skapaKonton: e.target.checked })}
                className="mr-3"
              />
              <span className="text-white">Skapa saknade konton automatiskt</span>
            </label>
            <div className="bg-blue-500/20 border border-blue-500 text-blue-400 px-3 py-2 rounded text-sm">
              <strong>🛡️ Duplicate-skydd:</strong> Importen avbryts automatiskt om befintliga
              verifikationer upptäcks för att förhindra dubbletter.
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <Knapp text="← Tillbaka" onClick={onBack} />
        <Knapp text="Fortsätt till förhandsvisning →" onClick={onNext} />
      </div>
    </div>
  );
}

// Komponent för Steg 3: Förhandsvisning
function FörhandsvisningSteg({
  sieData,
  settings,
  onNext,
  onBack,
}: {
  sieData: SieData;
  settings: any;
  onNext: () => void;
  onBack: () => void;
}) {
  // Filtrera verifikationer baserat på datumintervall
  const filtradeVerifikationer = sieData.verifikationer.filter((v) => {
    // Konvertera SIE-datum (YYYYMMDD) till HTML-datum (YYYY-MM-DD) för jämförelse
    const formatDatum = (datum: string) => {
      if (datum.length === 8) {
        return `${datum.slice(0, 4)}-${datum.slice(4, 6)}-${datum.slice(6, 8)}`;
      }
      return datum;
    };

    const verifikationsDatum = formatDatum(v.datum);

    if (settings.startDatum && verifikationsDatum < settings.startDatum) return false;
    if (settings.slutDatum && verifikationsDatum > settings.slutDatum) return false;
    return true;
  });

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-4">Steg 3: Förhandsvisning</h2>

      <div className="space-y-4">
        <div className="bg-blue-500/20 border border-blue-500 text-blue-400 px-4 py-3 rounded">
          <strong>📋 Sammanfattning:</strong> Följande kommer att importeras till din databas:
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {settings.inkluderaVerifikationer && (
            <div className="bg-slate-800 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-2">Verifikationer</h3>
              <div className="text-2xl font-bold text-cyan-400">
                {filtradeVerifikationer.length}
              </div>
              <div className="text-sm text-gray-400">verifikationer</div>
            </div>
          )}

          {settings.inkluderaBalanser && (
            <div className="bg-slate-800 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-2">Balanser</h3>
              <div className="text-2xl font-bold text-green-400">
                {sieData.balanser.ingående.length + sieData.balanser.utgående.length}
              </div>
              <div className="text-sm text-gray-400">balansposter</div>
            </div>
          )}

          {settings.inkluderaResultat && (
            <div className="bg-slate-800 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-2">Resultat</h3>
              <div className="text-2xl font-bold text-purple-400">{sieData.resultat.length}</div>
              <div className="text-sm text-gray-400">resultatposter</div>
            </div>
          )}
        </div>

        {settings.startDatum || settings.slutDatum ? (
          <div className="bg-yellow-500/20 border border-yellow-500 text-yellow-400 px-4 py-3 rounded">
            <strong>📅 Datumfilter:</strong>
            {settings.startDatum && ` Från ${settings.startDatum}`}
            {settings.slutDatum && ` Till ${settings.slutDatum}`}
          </div>
        ) : null}

        <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded">
          <strong>⚠️ Varning:</strong> Detta är en permanent åtgärd. Se till att du har en backup av
          din databas innan du fortsätter.
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <Knapp text="← Ändra inställningar" onClick={onBack} />
        <Knapp text="Starta import!" onClick={onNext} />
      </div>
    </div>
  );
}

// Komponent för Steg 4: Import
function ImportSteg({
  sieData,
  saknadeKonton,
  settings,
  selectedFile,
  onComplete,
}: {
  sieData: SieData;
  saknadeKonton: string[];
  settings: any;
  selectedFile?: File | null;
  onComplete: (resultat: any) => void;
}) {
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState("Förbereder import...");
  const [error, setError] = useState<string | null>(null);

  // Utför riktig import
  useEffect(() => {
    const utförImport = async () => {
      try {
        // Steg 1: Skapa saknade konton
        setCurrentTask("Skapar saknade konton...");
        setProgress(20);

        if (settings.skapaKonton && saknadeKonton.length > 0) {
          const kontoData = saknadeKonton.map((nummer) => {
            const kontoInfo = sieData.konton.find((k) => k.nummer === nummer);
            return {
              nummer,
              namn: kontoInfo?.namn || `Konto ${nummer}`,
            };
          });

          const kontoResult = await skapaKonton(kontoData);
          if (!kontoResult.success) {
            throw new Error(kontoResult.error || "Kunde inte skapa konton");
          }
        }

        // Steg 2: Förbereder import
        setCurrentTask("Förbereder dataimport...");
        setProgress(40);

        // Steg 3: Importera data
        setCurrentTask("Importerar SIE-data...");
        setProgress(60);

        const fileInfo = selectedFile
          ? {
              filnamn: selectedFile.name,
              filstorlek: selectedFile.size,
            }
          : undefined;

        const importResult = await importeraSieData(sieData, saknadeKonton, settings, fileInfo);
        console.log("📊 SIE Data ingående balanser:", sieData.balanser.ingående);
        console.log("📊 Import result:", importResult);

        if (!importResult.success) {
          throw new Error(importResult.error || "Kunde inte importera data");
        }

        // Steg 4: Validering
        setCurrentTask("Validerar importerad data...");
        setProgress(80);

        // Steg 5: Slutför
        setCurrentTask("Import slutförd!");
        setProgress(100);

        onComplete(importResult.resultat);
      } catch (err) {
        console.error("Import fel:", err);
        setError(err instanceof Error ? err.message : "Okänt fel");
      }
    };

    utförImport();
  }, []); // Kör bara en gång när komponenten mountas

  if (error) {
    return (
      <div className="text-center">
        <h2 className="text-xl font-semibold text-white mb-8">Import misslyckades</h2>
        <div className="max-w-2xl mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-600 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl">✗</span>
          </div>
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-6 py-4 rounded mb-4 text-left">
            <div className="font-semibold mb-3">
              🚨 Import avbruten - Duplicata verifikationer upptäckta!
            </div>

            {error.includes("Följande verifikationer finns redan") && (
              <>
                <div className="mb-3">
                  <strong>Följande verifikationer finns redan i din databas:</strong>
                </div>
                <div className="bg-red-600/20 p-3 rounded text-sm font-mono max-h-60 overflow-y-auto mb-3">
                  {error
                    .split("• ")
                    .slice(1) // Ta bort första tomma elementet
                    .map((line, index) => (
                      <div key={index} className="mb-1">
                        • {line.split(" 💡")[0]} {/* Ta bort tipset från slutet */}
                      </div>
                    ))}
                </div>
                <div className="text-yellow-300">
                  💡 Detta förhindrar oavsiktliga dubbletter. Om du vill importera ändå, ta först
                  bort de befintliga verifikationerna.
                </div>
              </>
            )}

            {!error.includes("Följande verifikationer finns redan") && (
              <div>
                <strong>Fel:</strong> {error}
              </div>
            )}
          </div>
          <Knapp text="Försök igen" onClick={() => window.location.reload()} />
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <h2 className="text-xl font-semibold text-white mb-8">Steg 4: Importerar data</h2>

      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-lg text-white mb-2">{currentTask}</div>

          {progress === 60 && currentTask.includes("Importerar SIE-data") && (
            <div className="bg-blue-500/20 border border-blue-500 text-blue-300 px-4 py-3 rounded mt-4 text-sm">
              <div className="font-semibold mb-2">⏳ Detta kan ta en stund...</div>
              <div className="text-left text-xs">
                • Skapar konton i databasen
                <br />• Importerar {sieData.verifikationer.length} verifikationer
                <br />• Bearbetar{" "}
                {sieData.verifikationer.reduce(
                  (total, ver) => total + ver.transaktioner.length,
                  0
                )}{" "}
                transaktionsposter
                <br />• Validerar all data för korrekthet
              </div>
            </div>
          )}
        </div>

        <div className="w-full bg-slate-600 rounded-full h-3 mb-4">
          <div
            className="bg-cyan-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <div className="text-sm text-gray-400">{Math.round(progress)}% slutfört</div>
      </div>
    </div>
  );
}

// Komponent för Steg 5: Resultat
function ResultatSteg({ resultat, onFinish }: { resultat: any; onFinish: () => void }) {
  return (
    <div className="text-center">
      <h2 className="text-xl font-semibold text-white mb-8">Import slutförd!</h2>

      <div className="max-w-md mx-auto">
        <div className="w-16 h-16 mx-auto mb-6 bg-green-600 rounded-full flex items-center justify-center">
          <span className="text-white text-2xl">✓</span>
        </div>

        <div className="bg-green-500/20 border border-green-500 text-green-400 px-4 py-3 rounded mb-6">
          <strong>🎉 Klart!</strong> All data har importerats till din databas.
        </div>

        {resultat && (
          <div className="bg-slate-800 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-white mb-3">Importstatistik:</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <div>✅ Konton skapade: {resultat.kontonSkapade || 0}</div>
              <div>✅ Verifikationer importerade: {resultat.verifikationerImporterade || 0}</div>
              <div>✅ Balanser importerade: {resultat.balanserImporterade || 0}</div>
              <div>✅ Resultatposter importerade: {resultat.resultatImporterat || 0}</div>
            </div>
          </div>
        )}

        <div className="space-y-2 text-sm text-gray-400 mb-6">
          <div>• Datavalidering slutförd</div>
          <div>• Import säkert genomförd</div>
        </div>

        <KnappFullWidth text="Tillbaka till SIE-import" onClick={onFinish} />
      </div>
    </div>
  );
}

export default function SiePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sieData, setSieData] = useState<SieData | null>(null);
  const [saknadeKonton, setSaknadeKonton] = useState<string[]>([]);
  const [visaSaknade, setVisaSaknade] = useState(false);
  const [visaWizard, setVisaWizard] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [analys, setAnalys] = useState<Analys | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "översikt" | "konton" | "verifikationer" | "balanser" | "resultat"
  >("översikt");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setSieData(null);
      setSaknadeKonton([]);
      setVisaSaknade(false);
      setAnalys(null);
      setCurrentPage(1);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (
      file &&
      (file.name.endsWith(".sie") || file.name.endsWith(".se4") || file.name.endsWith(".se"))
    ) {
      setSelectedFile(file);
      setError(null);
      setSieData(null);
      setSaknadeKonton([]);
      setVisaSaknade(false);
      setAnalys(null);
      setCurrentPage(1);
    } else {
      setError("Vänligen välj en .sie, .se4 eller .se fil");
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);

    try {
      // Frontend validering
      const sizeValidation = validateFileSize(selectedFile);
      if (!sizeValidation.valid) {
        setError(sizeValidation.error || "Filen är för stor");
        return;
      }

      // Validera filtyp
      if (
        !selectedFile.name.toLowerCase().endsWith(".se4") &&
        !selectedFile.name.toLowerCase().endsWith(".sie") &&
        !selectedFile.name.toLowerCase().endsWith(".se")
      ) {
        setError("Endast SIE-filer (.sie, .se4, .se) stöds");
        return;
      }

      // Läs och parsa fil frontend
      const arrayBuffer = await selectedFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // 🎯 Smart encoding för SIE-filer
      let content = "";

      // Kolla först FORMAT för att välja rätt encoding
      const quickTest = new TextDecoder("utf-8", { fatal: false }).decode(uint8Array.slice(0, 500));
      const formatMatch = quickTest.match(/#FORMAT\s+(\w+)/);

      if (formatMatch) {
        const format = formatMatch[1].toUpperCase();
        console.log(`🏷️ Frontend SIE FORMAT: ${format}`);

        if (format === "PC8") {
          console.log("🎯 PC8 detekterat - använder CP850");
          try {
            content = decodeCP850(uint8Array);
            console.log("✅ Använder encoding: cp850 (manuell dekodning)");
          } catch (error) {
            console.log("❌ CP850 dekodning misslyckades:", error);
          }
        }
      }

      // Om CP850 inte fungerade, prova andra encodings
      if (!content) {
        console.log("🔄 Provar andra encodings...");
        const encodings = ["iso-8859-1", "windows-1252", "utf-8", "cp850"];

        for (const encoding of encodings) {
          try {
            const decoder = new TextDecoder(encoding);
            const testContent = decoder.decode(uint8Array);

            if (testContent.includes("#KONTO") || testContent.includes("#FNAMN")) {
              content = testContent;
              console.log(`✅ Använder encoding: ${encoding}`);
              break;
            }
          } catch (error) {
            console.log(`❌ Encoding ${encoding} misslyckades:`, error);
          }
        }
      }

      if (!content) {
        content = new TextDecoder("utf-8").decode(uint8Array);
      }

      // Hantera svenska tecken
      content = content
        .replace(/�/g, "ä")
        .replace(/�/g, "å")
        .replace(/�/g, "ö")
        .replace(/�/g, "Ä")
        .replace(/�/g, "Å")
        .replace(/�/g, "Ö")
        .replace(/\x84/g, "ä") // CP850 ä
        .replace(/\x86/g, "å") // CP850 å
        .replace(/\x94/g, "ö") // CP850 ö
        .replace(/\x8E/g, "Ä") // CP850 Ä
        .replace(/\x8F/g, "Å") // CP850 Å
        .replace(/\x99/g, "Ö") // CP850 Ö
        .replace(/\xE4/g, "ä") // ISO-8859-1 ä
        .replace(/\xE5/g, "å") // ISO-8859-1 å
        .replace(/\xF6/g, "ö") // ISO-8859-1 ö
        .replace(/\xC4/g, "Ä") // ISO-8859-1 Ä
        .replace(/\xC5/g, "Å") // ISO-8859-1 Å
        .replace(/\xD6/g, "Ö"); // ISO-8859-1 Ö

      // Parsa SIE-innehåll frontend
      const parsedSieData = parseSieContent(content);

      // Hitta använda konton
      const anvandaKonton = new Set<string>();
      parsedSieData.verifikationer.forEach((ver) => {
        ver.transaktioner.forEach((trans) => {
          anvandaKonton.add(trans.konto);
        });
      });
      parsedSieData.balanser.ingående.forEach((b) => anvandaKonton.add(b.konto));
      parsedSieData.balanser.utgående.forEach((b) => anvandaKonton.add(b.konto));
      parsedSieData.resultat.forEach((r) => anvandaKonton.add(r.konto));

      const sieKonton = parsedSieData.konton.map((k) => k.nummer);

      // Analysera konton frontend (simplified - vi behöver fortfarande server för att kolla befintliga konton)
      const accountAnalysis = analyzeAccounts(sieKonton, Array.from(anvandaKonton));

      // Nu skicka parsad data till server för kontokontroll
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("parsedData", JSON.stringify(parsedSieData));
      formData.append("anvandaKonton", JSON.stringify(Array.from(anvandaKonton)));

      const result = await uploadSieFile(formData);

      if (result.success) {
        setSieData(parsedSieData);
        setSaknadeKonton(result.saknade || []);
        setAnalys(result.analys || accountAnalysis);
        setCurrentPage(1);
      } else {
        setError(result.error || "Fel vid uppladdning av fil");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("Ett oväntat fel uppstod vid uppladdning");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    setError(null);

    try {
      // Frontend validering innan server call
      const currentYear = new Date().getFullYear();
      const exportYear = 2025;

      if (exportYear < 2020 || exportYear > currentYear + 2) {
        setError("Ogiltigt år för export");
        return;
      }

      const result = await exporteraSieData(exportYear);

      if (result.success && result.data) {
        // Validera export-data
        if (!result.data || result.data.length < 100) {
          setError("Export-filen verkar vara tom eller korrupt");
          return;
        }

        // Skapa blob och ladda ner fil
        const blob = new Blob([result.data], { type: "text/plain;charset=utf-8" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `export_${new Date().toISOString().slice(0, 10)}.se4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        // Success feedback (could add a success state)
        console.log("SIE-fil exporterad framgångsrikt");
      } else {
        setError(result.error || "Kunde inte exportera SIE-data");
      }
    } catch (err) {
      console.error("Export error:", err);
      setError("Ett oväntat fel uppstod vid export av SIE-data");
    } finally {
      setExportLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency: "SEK",
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("sv-SE");
  };

  // Pagination helpers
  const getPaginatedData = (data: any[], page: number) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (totalItems: number) => {
    return Math.ceil(totalItems / itemsPerPage);
  };

  const PaginationControls = ({
    totalItems,
    currentPage,
    onPageChange,
  }: {
    totalItems: number;
    currentPage: number;
    onPageChange: (page: number) => void;
  }) => {
    const totalPages = getTotalPages(totalItems);

    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center items-center space-x-2 mt-6">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3 py-2 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:text-gray-500 text-white rounded"
        >
          ← Föregående
        </button>

        <span className="text-white px-4">
          Sida {currentPage} av {totalPages} ({totalItems} objekt)
        </span>

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-2 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:text-gray-500 text-white rounded"
        >
          Nästa →
        </button>
      </div>
    );
  };

  // Visa wizard om användaren väljer det
  if (visaWizard && sieData && analys) {
    return (
      <ImportWizard
        sieData={sieData}
        saknadeKonton={saknadeKonton}
        analys={analys}
        selectedFile={selectedFile}
        onCancel={() => setVisaWizard(false)}
      />
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">SIE Import</h1>
          <p className="text-gray-300">Ladda upp SIE-filer för att visa bokföringsdata</p>

          {/* Export knapp */}
          <div className="mt-6">
            <Knapp
              text={exportLoading ? "Exporterar..." : "📤 Exportera SIE-fil"}
              onClick={handleExport}
              disabled={exportLoading}
            />
          </div>
        </div>

        {/* Filuppladdning */}
        {!sieData && (
          <div className="bg-slate-800 rounded-lg p-8 mb-6">
            <div
              className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-cyan-500 transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <div className="text-6xl text-slate-600 mb-4">📁</div>
              <p className="text-xl text-white mb-4">
                Dra och släpp SIE-fil här eller klicka för att välja
              </p>
              <input
                type="file"
                accept=".sie,.se4,.se"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-block bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg cursor-pointer transition-colors"
              >
                Välj fil
              </label>

              {selectedFile && (
                <div className="mt-6">
                  <p className="text-white mb-4">
                    Vald fil: <strong>{selectedFile.name}</strong>
                  </p>
                  <Knapp
                    text={loading ? "Laddar..." : "Ladda upp och analysera"}
                    onClick={handleUpload}
                    disabled={loading}
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded mt-4">
                {error}
              </div>
            )}
          </div>
        )}

        {/* SIE Data Visning */}
        {sieData && (
          <div className="bg-slate-800 rounded-lg p-6">
            {/* Header med företagsinfo */}
            <div className="mb-6 bg-slate-700 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Företagsinformation</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white">
                <div>
                  <strong>Program:</strong> {sieData.header.program}
                </div>
                <div>
                  <strong>Organisationsnummer:</strong> {sieData.header.organisationsnummer}
                </div>
                <div>
                  <strong>Företagsnamn:</strong> {sieData.header.företagsnamn}
                </div>
                <div>
                  <strong>Kontoplan:</strong> {sieData.header.kontoplan}
                </div>
              </div>

              {/* Varning för saknade konton */}
              {analys && (analys.specialKonton > 0 || analys.kritiskaKonton.length > 0) && (
                <div className="mt-4 space-y-2">
                  {/* Info om kontoanalys */}
                  <div className="bg-blue-500/20 border border-blue-500 text-blue-400 px-4 py-3 rounded">
                    <div className="flex items-center justify-between">
                      <div>
                        <strong>ℹ️ Kontoanalys:</strong> SIE-filen innehåller {analys.totaltAntal}{" "}
                        konton från hela BAS-kontoplanen.{" "}
                        {saknadeKonton.length > 0
                          ? `${saknadeKonton.length} specialkonto behöver granskas.`
                          : "Alla använda konton finns redan i din kontoplan."}
                      </div>
                      {saknadeKonton.length > 0 && (
                        <button
                          onClick={() => setVisaSaknade(!visaSaknade)}
                          className="ml-4 underline hover:no-underline text-sm"
                        >
                          {visaSaknade ? "Dölj specialkonton" : "Visa specialkonton"} →
                        </button>
                      )}
                    </div>

                    {/* Expanderbar lista med saknade konton */}
                    {visaSaknade && saknadeKonton.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-blue-400/30">
                        <h4 className="font-semibold text-blue-300 mb-3">
                          Specialkonton som saknas ({saknadeKonton.length} st)
                        </h4>
                        <p className="text-blue-300 text-sm mb-3">
                          Dessa konton är inte BAS-standardkonton och bör granskas:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                          {saknadeKonton.map((kontonummer) => {
                            const kontoInfo = sieData?.konton.find((k) => k.nummer === kontonummer);
                            return (
                              <div key={kontonummer} className="bg-blue-900/30 rounded-lg p-2">
                                <div className="text-sm font-bold text-blue-200">{kontonummer}</div>
                                {kontoInfo && (
                                  <div className="text-blue-300 text-xs mt-1">{kontoInfo.namn}</div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Kritiska konton varning - behåll denna */}
                  {analys.kritiskaKonton.length > 0 && (
                    <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded">
                      <strong>🚨 Kritisk:</strong> {analys.kritiskaKonton.length} kritiska
                      företagsspecifika konton saknas som behöver skapas för korrekt import.
                    </div>
                  )}

                  {/* Info om standardkonton */}
                  {analys.standardKonton > 0 && (
                    <div className="bg-blue-500/20 border border-blue-500 text-blue-400 px-4 py-3 rounded text-sm">
                      <strong>ℹ️ Info:</strong> {analys.standardKonton} BAS-standardkonton hittades
                      som inte finns i din kontoplan (detta är normalt).
                    </div>
                  )}

                  {/* Import-knapp */}
                  <div className="bg-green-500/20 border border-green-500 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-green-400 mb-1">Redo att importera?</h3>
                        <p className="text-green-300 text-sm">
                          Starta import-wizarden för att säkert importera data till din databas.
                        </p>
                      </div>
                      <Knapp text="Starta Import-wizard →" onClick={() => setVisaWizard(true)} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Flikar */}
            <div className="mb-6">
              <div className="flex space-x-1 bg-slate-700 p-1 rounded-lg">
                {["översikt", "konton", "verifikationer", "balanser", "resultat"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab as any);
                      setCurrentPage(1);
                    }}
                    className={`px-4 py-2 rounded-md capitalize transition-colors ${
                      activeTab === tab
                        ? "bg-cyan-600 text-white"
                        : "text-gray-300 hover:text-white hover:bg-slate-600"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab innehåll */}
            {activeTab === "översikt" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-700 rounded-lg p-6 text-center">
                    <h3 className="text-lg font-semibold text-white mb-2">Antal Konton</h3>
                    <p className="text-3xl font-bold text-cyan-400">{sieData.konton.length}</p>
                  </div>
                  <div className="bg-slate-700 rounded-lg p-6 text-center">
                    <h3 className="text-lg font-semibold text-white mb-2">Antal Verifikationer</h3>
                    <p className="text-3xl font-bold text-cyan-400">
                      {sieData.verifikationer.length}
                    </p>
                  </div>
                  <div className="bg-slate-700 rounded-lg p-6 text-center">
                    <h3 className="text-lg font-semibold text-white mb-2">Räkenskapsår</h3>
                    <p className="text-lg text-white">
                      {sieData.header.räkenskapsår.length > 0 &&
                        `${sieData.header.räkenskapsår[0].startdatum} - ${sieData.header.räkenskapsår[0].slutdatum}`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "konton" && (
              <div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-white">
                    <thead>
                      <tr className="border-b border-slate-600">
                        <th className="text-left py-3 px-4">Kontonummer</th>
                        <th className="text-left py-3 px-4">Kontonamn</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getPaginatedData(sieData.konton, currentPage).map((konto, index) => (
                        <tr key={index} className="border-b border-slate-700 hover:bg-slate-700">
                          <td className="py-3 px-4">{konto.nummer}</td>
                          <td className="py-3 px-4">{konto.namn}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <PaginationControls
                  totalItems={sieData.konton.length}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}

            {activeTab === "verifikationer" && (
              <div>
                <div className="space-y-4">
                  {getPaginatedData(sieData.verifikationer, currentPage).map((ver, index) => (
                    <div key={index} className="bg-slate-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-white font-semibold">
                            {ver.serie} {ver.nummer}
                          </h4>
                          <p className="text-gray-300">{ver.beskrivning}</p>
                        </div>
                        <div className="text-gray-300">{ver.datum}</div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-600">
                              <th className="text-left py-2 text-gray-300">Konto</th>
                              <th className="text-right py-2 text-gray-300">Belopp</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ver.transaktioner.map(
                              (trans: { konto: string; belopp: number }, i: number) => (
                                <tr key={i} className="text-white">
                                  <td className="py-1">{trans.konto}</td>
                                  <td className="py-1 text-right">
                                    {formatCurrency(trans.belopp)}
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
                <PaginationControls
                  totalItems={sieData.verifikationer.length}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}

            {activeTab === "balanser" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">Ingående Balanser</h3>
                  <div className="overflow-x-auto max-h-96">
                    <table className="min-w-full text-white text-sm">
                      <thead>
                        <tr className="border-b border-slate-600">
                          <th className="text-left py-2">Konto</th>
                          <th className="text-right py-2">Belopp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sieData.balanser.ingående.map((balans, index) => (
                          <tr key={index} className="border-b border-slate-700">
                            <td className="py-2">{balans.konto}</td>
                            <td className="py-2 text-right">{formatCurrency(balans.belopp)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">Utgående Balanser</h3>
                  <div className="overflow-x-auto max-h-96">
                    <table className="min-w-full text-white text-sm">
                      <thead>
                        <tr className="border-b border-slate-600">
                          <th className="text-left py-2">Konto</th>
                          <th className="text-right py-2">Belopp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sieData.balanser.utgående.map((balans, index) => (
                          <tr key={index} className="border-b border-slate-700">
                            <td className="py-2">{balans.konto}</td>
                            <td className="py-2 text-right">{formatCurrency(balans.belopp)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "resultat" && (
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Resultaträkning</h3>
                <div className="overflow-x-auto max-h-96">
                  <table className="min-w-full text-white text-sm">
                    <thead>
                      <tr className="border-b border-slate-600">
                        <th className="text-left py-2">Konto</th>
                        <th className="text-right py-2">Belopp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sieData.resultat.map((resultat, index) => (
                        <tr key={index} className="border-b border-slate-700">
                          <td className="py-2">{resultat.konto}</td>
                          <td className="py-2 text-right">{formatCurrency(resultat.belopp)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Återställ knapp */}
            <div className="mt-8 text-center">
              <Knapp
                text="Ladda upp ny fil"
                onClick={() => {
                  setSieData(null);
                  setSelectedFile(null);
                  setSaknadeKonton([]);
                  setVisaSaknade(false);
                  setAnalys(null);
                  setActiveTab("översikt");
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
