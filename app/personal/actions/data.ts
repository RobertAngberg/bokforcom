"use server";

import { hamtaAllaAnstallda } from "./anstalldaActions";
import type { AnställdData } from "../types/types";

// Hämta initial data för personal-sidan
export async function hamtaPersonalInitialData() {
  try {
    const anställdaData = await hamtaAllaAnstallda();
    const råData = anställdaData as Array<Record<string, unknown>>;

    const fullAnställdaData: AnställdData[] = råData.map((rad) => {
      const getString = (key: string) => {
        const value = rad[key];
        if (value == null) return "";
        return typeof value === "string" ? value : String(value);
      };

      const namn =
        getString("namn") ||
        [getString("förnamn"), getString("efternamn")].filter(Boolean).join(" ");

      const växaStödValue =
        typeof rad["växaStöd"] === "boolean"
          ? (rad["växaStöd"] as boolean)
          : rad["växa_stöd"] === true;

      return {
        ...(rad as AnställdData),
        namn,
        epost: getString("epost") || getString("mail"),
        ersättningPer: getString("ersättningPer") || getString("ersättning_per"),
        deltidProcent: getString("deltidProcent") || getString("deltid_procent"),
        tjänsteställeAdress: getString("tjänsteställeAdress") || getString("tjänsteställe_adress"),
        tjänsteställeOrt: getString("tjänsteställeOrt") || getString("tjänsteställe_ort"),
        semesterdagarPerÅr: getString("semesterdagarPerÅr") || getString("semesterdagar_per_år"),
        växaStöd: växaStödValue,
      } as AnställdData;
    });

    return {
      success: true,
      data: {
        anställda: fullAnställdaData,
      },
    };
  } catch (error) {
    console.error("❌ Fel vid hämtning av personal initial data:", error);
    return {
      success: false,
      data: {
        anställda: [],
      },
      error: "Kunde inte hämta personal-data",
    };
  }
}
