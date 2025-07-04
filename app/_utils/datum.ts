// Konverterar "2024-05-07" (sträng) till Date-objekt
export function ÅÅÅÅMMDDTillDate(datum: string | null | undefined): Date | null {
  return datum ? new Date(`${datum}T00:00:00`) : null;
}

// Konverterar ett Date-objekt till "2024-05-07" (sträng)
export function dateTillÅÅÅÅMMDD(date: Date | null): string {
  return date ? date.toISOString().split("T")[0] : "";
}
