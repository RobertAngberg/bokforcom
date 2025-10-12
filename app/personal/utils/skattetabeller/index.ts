/* Rådatasetet är en rak spegling av Skatteverkets CSV (alla kolumner kvar). */
import { SKATTETABELL_2025 } from "./skattetabell2025";

type SkattekolumnKey =
  | "Kolumn 1"
  | "Kolumn 2"
  | "Kolumn 3"
  | "Kolumn 4"
  | "Kolumn 5"
  | "Kolumn 6"
  | "Kolumn 7";

const TABELL_KEY = "Tabellnr" as const;
const ANTAL_KEY = "Antal dgr" as const;
const INKOMST_FRÅN_KEY = "Inkomst fr.o.m." as const;
const INKOMST_TILL_KEY = "Inkomst t.o.m." as const;
const DEFAULT_ANTAL_DGR = "30B";
const PROCENT_ANTAL = "30%";

const KOLUMN_KEYS: SkattekolumnKey[] = [
  "Kolumn 1",
  "Kolumn 2",
  "Kolumn 3",
  "Kolumn 4",
  "Kolumn 5",
  "Kolumn 6",
  "Kolumn 7",
];

type SkattetabellRad = Record<string, string> & {
  [TABELL_KEY]: string;
  [ANTAL_KEY]: string;
  [INKOMST_FRÅN_KEY]?: string;
  [INKOMST_TILL_KEY]?: string;
};

type RowData = {
  from: number | null;
  to: number | null;
  columns: Record<SkattekolumnKey, number | null>;
};

type PercentRowData = RowData & {
  base: Record<SkattekolumnKey, number | null>;
};

type TabellCache = {
  rowsByAntal: Record<string, readonly RowData[]>;
  percentRows: readonly PercentRowData[];
  antalDgr: readonly string[];
};

const DATA = SKATTETABELL_2025 as readonly SkattetabellRad[];
const TABELL_CACHE = byggCache();

function parseInteger(value: string | undefined): number | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed === "") {
    return null;
  }
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function byggCache(): Record<number, TabellCache> {
  const grupper = new Map<number, Array<{ antal: string; row: RowData }>>();
  for (const rad of DATA) {
    const tabellnr = parseInteger(rad[TABELL_KEY]);
    if (tabellnr === null) {
      continue;
    }
    const row: RowData = {
      from: parseInteger(rad[INKOMST_FRÅN_KEY]),
      to: parseInteger(rad[INKOMST_TILL_KEY]),
      columns: Object.fromEntries(
        KOLUMN_KEYS.map((key) => [key, parseInteger(rad[key])])
      ) as Record<SkattekolumnKey, number | null>,
    };
    const lista = grupper.get(tabellnr);
    if (lista) {
      lista.push({ antal: rad[ANTAL_KEY], row });
    } else {
      grupper.set(tabellnr, [{ antal: rad[ANTAL_KEY], row }]);
    }
  }

  const resultat: Record<number, TabellCache> = {};
  for (const [tabellnr, poster] of grupper.entries()) {
    const viaAntal = new Map<string, RowData[]>();
    for (const post of poster) {
      if (!viaAntal.has(post.antal)) {
        viaAntal.set(post.antal, []);
      }
      viaAntal.get(post.antal)!.push(post.row);
    }

    for (const lista of viaAntal.values()) {
      lista.sort((a, b) => {
        const vänster = a.from ?? Number.MAX_SAFE_INTEGER;
        const höger = b.from ?? Number.MAX_SAFE_INTEGER;
        return vänster - höger;
      });
    }

    const basrader = viaAntal.get(DEFAULT_ANTAL_DGR) ?? [];
    const procRows = viaAntal.get(PROCENT_ANTAL) ?? [];
    const sistaBelopp: Record<SkattekolumnKey, number | null> = Object.fromEntries(
      KOLUMN_KEYS.map((key) => [key, null])
    ) as Record<SkattekolumnKey, number | null>;

    for (const rad of basrader) {
      for (const key of KOLUMN_KEYS) {
        const värde = rad.columns[key];
        if (värde !== null) {
          sistaBelopp[key] = värde;
        }
      }
    }

    const procentmeta: PercentRowData[] = procRows.map((rad) => {
      const bas: Record<SkattekolumnKey, number | null> = Object.fromEntries(
        KOLUMN_KEYS.map((key) => [key, sistaBelopp[key]])
      ) as Record<SkattekolumnKey, number | null>;

      const meta: PercentRowData = {
        from: rad.from,
        to: rad.to,
        columns: rad.columns,
        base: bas,
      };

      if (rad.from !== null && rad.to !== null) {
        const steg = Math.ceil((rad.to - rad.from + 1) / 100);
        if (steg > 0) {
          for (const key of KOLUMN_KEYS) {
            const påslag = rad.columns[key];
            if (påslag !== null && sistaBelopp[key] !== null) {
              sistaBelopp[key] = sistaBelopp[key]! + påslag * steg;
            }
          }
        }
      }

      return meta;
    });

    if (procentmeta.length > 0) {
      viaAntal.set(PROCENT_ANTAL, procentmeta);
    }

    const antalDgr = Array.from(viaAntal.keys()).sort();
    resultat[tabellnr] = {
      rowsByAntal: Object.fromEntries(
        antalDgr.map((nyckel) => [nyckel, viaAntal.get(nyckel)! as readonly RowData[]])
      ),
      percentRows: procentmeta,
      antalDgr,
    };
  }

  return resultat;
}

function kolumnNyckel(kolumn: number): SkattekolumnKey | null {
  const index = kolumn - 1;
  if (index < 0 || index >= KOLUMN_KEYS.length) {
    return null;
  }
  return KOLUMN_KEYS[index];
}

function hittaRad<T extends RowData>(rader: readonly T[], bruttolön: number): T | null {
  for (const rad of rader) {
    const från = rad.from ?? 0;
    const till = rad.to ?? Number.MAX_SAFE_INTEGER;
    if (bruttolön >= från && bruttolön <= till) {
      return rad;
    }
  }
  return null;
}

function beräknaFrånProcentrad(
  rad: PercentRowData,
  kolumn: SkattekolumnKey,
  bruttolön: number
): number | null {
  const bas = rad.base[kolumn];
  const steg = rad.columns[kolumn];
  const start = rad.from;
  if (bas === null || steg === null || start === null) {
    return null;
  }
  const diff = bruttolön - (start - 1);
  if (diff <= 0) {
    return bas;
  }
  const block = Math.ceil(diff / 100);
  return bas + steg * block;
}

export function hämtaSkattFrånTabell(
  bruttolön: number,
  tabell?: number,
  kolumn?: number,
  antalDgr: string = DEFAULT_ANTAL_DGR
): number | null {
  if (!tabell || !kolumn) {
    return null;
  }

  const cache = TABELL_CACHE[tabell];
  if (!cache) {
    return null;
  }

  const kolumnKey = kolumnNyckel(kolumn);
  if (!kolumnKey) {
    return null;
  }

  const rader = cache.rowsByAntal[antalDgr];
  if (rader) {
    const rad = hittaRad(rader, bruttolön);
    if (rad) {
      if (antalDgr === PROCENT_ANTAL) {
        const procRad = rad as PercentRowData;
        const värde = beräknaFrånProcentrad(procRad, kolumnKey, bruttolön);
        if (värde !== null) {
          return värde;
        }
      } else {
        const värde = rad.columns[kolumnKey];
        if (värde !== null) {
          return värde;
        }
      }
    }
  }

  const procRad = hittaRad(cache.percentRows, bruttolön);
  if (procRad) {
    return beräknaFrånProcentrad(procRad, kolumnKey, bruttolön);
  }

  return null;
}

export function finnsSkattetabell(tabell?: number, antalDgr: string = DEFAULT_ANTAL_DGR): boolean {
  if (!tabell) {
    return false;
  }
  const cache = TABELL_CACHE[tabell];
  if (!cache) {
    return false;
  }
  if (cache.rowsByAntal[antalDgr]?.length) {
    return true;
  }
  if (antalDgr === DEFAULT_ANTAL_DGR && cache.percentRows.length > 0) {
    return true;
  }
  return false;
}

export function finnsSkattekolumn(
  tabell: number,
  kolumn: number | undefined | null,
  antalDgr: string = DEFAULT_ANTAL_DGR
): boolean {
  if (!kolumn) {
    return false;
  }
  const kolumnKey = kolumnNyckel(kolumn);
  if (!kolumnKey) {
    return false;
  }
  const cache = TABELL_CACHE[tabell];
  if (!cache) {
    return false;
  }
  const rader = cache.rowsByAntal[antalDgr];
  if (rader?.length) {
    const rad = rader[0];
    if (antalDgr === PROCENT_ANTAL) {
      const procRad = rad as PercentRowData;
      return procRad.columns[kolumnKey] !== undefined;
    }
    return rad.columns[kolumnKey] !== undefined;
  }
  if (cache.percentRows.length > 0) {
    return cache.percentRows[0].columns[kolumnKey] !== undefined;
  }
  return false;
}

export function listaTillgängligaSkattetabeller(antalDgr: string = DEFAULT_ANTAL_DGR): number[] {
  const resultat: number[] = [];
  for (const [nyckel, cache] of Object.entries(TABELL_CACHE)) {
    if (cache.rowsByAntal[antalDgr]?.length) {
      resultat.push(Number(nyckel));
      continue;
    }
    if (antalDgr === DEFAULT_ANTAL_DGR && cache.percentRows.length > 0) {
      resultat.push(Number(nyckel));
    }
  }
  resultat.sort((a, b) => a - b);
  return resultat;
}

export function listaTillgängligaAntalDgr(tabell?: number): string[] {
  if (!tabell) {
    return [];
  }
  const cache = TABELL_CACHE[tabell];
  if (!cache) {
    return [];
  }
  return [...cache.antalDgr];
}
