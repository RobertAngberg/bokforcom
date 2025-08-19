// Konverterar "2024-05-07" (sträng) till Date-objekt
export function ÅÅÅÅMMDDTillDate(datum: string | null | undefined): Date | null {
  return datum ? new Date(`${datum}T00:00:00`) : null;
}

// Konverterar ett Date-objekt till "2024-05-07" (sträng)
export function dateTillÅÅÅÅMMDD(date: Date | null): string {
  return date ? date.toISOString().split("T")[0] : "";
}

// Säker konvertering från sträng till Date med null-hantering
export function stringTillDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

// Helper för DatePicker - konverterar sträng till Date eller null
export function datePickerValue(dateString: string | null | undefined): Date | null {
  return dateString ? stringTillDate(dateString) : null;
}

// Helper för DatePicker onChange - konverterar Date till sträng
export function datePickerOnChange(date: Date | null): string {
  return dateTillÅÅÅÅMMDD(date);
}
