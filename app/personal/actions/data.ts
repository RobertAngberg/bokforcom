"use server";

import { hämtaAllaAnställda } from "./anstalldaActions";
import type { AnställdData } from "../types/types";

// Hämta initial data för personal-sidan
export async function hämtaPersonalInitialData() {
  try {
    // Hämta alla anställda med full data direkt
    const anställdaData = await hämtaAllaAnställda();

    // Returnera full AnställdData array så vi har all info tillgänglig
    const fullAnställdaData: AnställdData[] = anställdaData as AnställdData[];

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
