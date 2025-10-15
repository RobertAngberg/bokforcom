// Konverterar "2024-05-07" (sträng) till Date-objekt - SÄKERT
export function yyyyMmDdToDate(datum: string | null | undefined): Date | null {
  if (!datum) return null;

  const [år, månad, dag] = datum.split("-").map(Number);
  if (!år || !månad || !dag) return null;

  // Använd konstruktor med separata parametrar istället för string-parsing
  // Månad är 0-indexerad i JavaScript (0=januari, 11=december)
  return new Date(år, månad - 1, dag);
}

// Konverterar ett Date-objekt till "2024-05-07" (sträng) - SÄKERT
export function dateToYyyyMmDd(date: Date | null): string {
  if (!date) return "";

  // Använd lokala getter-metoder istället för toISOString()
  const år = date.getFullYear();
  const månad = (date.getMonth() + 1).toString().padStart(2, "0");
  const dag = date.getDate().toString().padStart(2, "0");

  return `${år}-${månad}-${dag}`;
}

// Säker konvertering från sträng till Date med null-hantering
export function stringTillDate(dateInput: string | Date | null | undefined): Date | null {
  if (!dateInput) return null;

  if (dateInput instanceof Date) {
    return Number.isNaN(dateInput.getTime()) ? null : dateInput;
  }

  if (typeof dateInput !== "string") return null;

  const date = yyyyMmDdToDate(dateInput);
  return date && !isNaN(date.getTime()) ? date : null;
}

// Helper för DatePicker - konverterar sträng till Date eller null
export function datePickerValue(dateInput: string | Date | null | undefined): Date | null {
  return dateInput ? stringTillDate(dateInput) : null;
}

// Helper för DatePicker onChange - konverterar Date till sträng
export function datePickerOnChange(date: Date | null): string {
  return dateToYyyyMmDd(date);
}

// Timezone-säker formattering för PostgreSQL TIMESTAMP WITH TIME ZONE
export function datumTillPostgreSQL(dateString: string | null): string | null {
  if (!dateString) return null;

  // Rensa bort eventuella befintliga timezone-markeringar
  const cleanDate = dateString.split("T")[0]; // Ta bara YYYY-MM-DD delen

  // Lägg till svensk timezone för att undvika UTC-konvertering
  return cleanDate + "T12:00:00+02:00";
}
