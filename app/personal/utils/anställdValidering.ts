/**
 * Validering av anställd-data innan lönespec skapas
 */

import type { AnställdListItem, AnställdData } from "../types/types";

export interface ValideringsResultat {
  giltig: boolean;
  saknadeFält: string[];
  meddelande?: string;
}

/**
 * Validerar att en anställd har alla obligatoriska fält för lönespec-skapande
 */
export function valideraAnställdFörLönespec(
  anställd: AnställdListItem | AnställdData | null | undefined
): ValideringsResultat {
  if (!anställd) {
    return {
      giltig: false,
      saknadeFält: ["anställd"],
      meddelande: "Ingen anställd vald",
    };
  }

  const saknadeFält: string[] = [];

  // Obligatoriska fält för lönespec
  if (!anställd.clearingnummer || anställd.clearingnummer.trim() === "") {
    saknadeFält.push("Clearingnummer");
  }

  if (!anställd.bankkonto || anställd.bankkonto.trim() === "") {
    saknadeFält.push("Bankkonto");
  }

  // Personnummer behövs för förhandsgranskning/PDF
  const personnummer = anställd.personnummer || (anställd as AnställdData).personnummer;
  if (!personnummer || personnummer.trim() === "") {
    saknadeFält.push("Personnummer");
  }

  // Skattetabell ska alltid vara int
  if (!anställd.skattetabell || anställd.skattetabell === 0) {
    saknadeFält.push("Skattetabell");
  }

  // Skattekolumn ska alltid vara int
  if (!anställd.skattekolumn || anställd.skattekolumn === 0) {
    saknadeFält.push("Skattekolumn");
  }

  // Kompensation behövs för löneberäkning - kolla både AnställdListItem och AnställdData
  const kompensation = anställd.kompensation || (anställd as AnställdData).kompensation;
  if (!kompensation || kompensation === "" || parseFloat(kompensation) === 0) {
    saknadeFält.push("Kompensation/Grundlön");
  }

  if (saknadeFält.length > 0) {
    const anställdNamn =
      (anställd as AnställdListItem).namn ||
      `${(anställd as AnställdData).förnamn} ${(anställd as AnställdData).efternamn}`;

    return {
      giltig: false,
      saknadeFält,
      meddelande: `Anställd "${anställdNamn}" saknar följande uppgifter: ${saknadeFält.join(", ")}`,
    };
  }

  return {
    giltig: true,
    saknadeFält: [],
  };
}

/**
 * Validerar flera anställda på en gång
 */
export function valideraFlertalsAnställda(
  anställda: (AnställdListItem | AnställdData)[],
  anställdaIds: number[]
): ValideringsResultat[] {
  return anställdaIds
    .map((id) => {
      const anställd = anställda.find((a) => a.id === id);
      return valideraAnställdFörLönespec(anställd);
    })
    .filter((resultat) => !resultat.giltig);
}

/**
 * Skapar ett användarvänligt felmeddelande från valideringsresultat
 */
export function skapaValideringsFelmeddelande(resultat: ValideringsResultat[]): string {
  if (resultat.length === 0) {
    return "";
  }

  if (resultat.length === 1) {
    return resultat[0].meddelande || "Validering misslyckades";
  }

  const antalAnställda = resultat.length;
  const allaSaknadeFält = new Set<string>();

  resultat.forEach((r) => {
    r.saknadeFält.forEach((fält) => allaSaknadeFält.add(fält));
  });

  return `${antalAnställda} anställda saknar uppgifter: ${Array.from(allaSaknadeFält).join(", ")}. Gå till Anställda-sidan och fyll i alla obligatoriska fält.`;
}
