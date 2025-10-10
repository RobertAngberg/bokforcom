"use server";

import { fetchTransaktioner } from "./actions";
import { HistoryItem } from "../types/types";

// Funktion för att formatera rådata från servern
function formatHistoryData(
  rawData: Array<{
    id: number;
    transaktionsdatum: string;
    kontobeskrivning: string;
    belopp: number;
    kommentar?: string;
    fil?: string;
    blob_url?: string;
  }>
): HistoryItem[] {
  return rawData.map((item) => ({
    transaktions_id: item.id,
    transaktionsdatum: new Date(item.transaktionsdatum).toISOString().slice(0, 10),
    kontobeskrivning: item.kontobeskrivning || "",
    belopp: item.belopp ?? 0,
    kommentar: item.kommentar ?? "",
    fil: item.fil ?? "",
    blob_url: item.blob_url ?? "",
  }));
}

export async function hamtaHistorikData(): Promise<HistoryItem[]> {
  try {
    const result = await fetchTransaktioner();

    const initialData =
      result.success && Array.isArray(result.data) ? formatHistoryData(result.data) : [];

    // Sortera data efter datum DESC, sedan ID DESC
    const sortedData = [...initialData].sort((a, b) => {
      const dateCompare =
        new Date(b.transaktionsdatum).getTime() - new Date(a.transaktionsdatum).getTime();
      if (dateCompare !== 0) return dateCompare;
      return b.transaktions_id - a.transaktions_id;
    });

    return sortedData;
  } catch {
    // Vid fel, returnera tom array
    return [];
  }
}
