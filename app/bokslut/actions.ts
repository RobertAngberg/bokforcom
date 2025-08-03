"use server";

import { redirect } from "next/navigation";

// Hämta användarens session
async function requireAuth() {
  // TODO: Implementera din egen autentisering här
  // const session = await getDinEgenAuth();
  // if (!session?.user?.id) {
  //   redirect("/login");
  // }
  // return session.user.id;

  // Mock för nu - returnera en hårdkodad user ID
  return "mock-user-id";
}

// Hämta bokslutsposter för en viss period
export async function hamtaBokslutsposter(period: string) {
  const userId = await requireAuth();

  // TODO: Implementera databaskoppling
  // Exempel på SQL-query:
  // SELECT * FROM bokslutsposter WHERE user_id = ? AND period = ?

  return [
    {
      id: "1",
      typ: "avskrivning",
      beskrivning: "Avskrivning datautrustning",
      belopp: -25000,
      konto: "7220",
      status: "bokford",
      datum: "2024-12-31",
    },
    // ... fler poster
  ];
}

// Skapa ny bokslutpost
export async function skapaBokslutpost(data: {
  typ: string;
  beskrivning: string;
  belopp: number;
  konto: string;
  period: string;
}) {
  const userId = await requireAuth();

  // TODO: Implementera databaskoppling
  // Exempel på SQL-query:
  // INSERT INTO bokslutsposter (user_id, typ, beskrivning, belopp, konto, period, status, datum)
  // VALUES (?, ?, ?, ?, ?, ?, 'utkast', NOW())

  return { success: true, id: Math.random().toString(36) };
}

// Uppdatera bokslutpost
export async function uppdateraBokslutpost(
  id: string,
  data: {
    typ?: string;
    beskrivning?: string;
    belopp?: number;
    konto?: string;
    status?: string;
  }
) {
  const userId = await requireAuth();

  // TODO: Implementera databaskoppling
  // Kontrollera att posten tillhör användaren
  // UPDATE bokslutsposter SET ... WHERE id = ? AND user_id = ?

  return { success: true };
}

// Ta bort bokslutpost
export async function taBortBokslutpost(id: string) {
  const userId = await requireAuth();

  // TODO: Implementera databaskoppling
  // DELETE FROM bokslutsposter WHERE id = ? AND user_id = ?

  return { success: true };
}

// Bokför bokslutpost (skapa verifikat)
export async function bokforBokslutpost(id: string) {
  const userId = await requireAuth();

  // TODO: Implementera logik för att:
  // 1. Hämta bokslutposten
  // 2. Skapa motsvarande transaktioner/verifikat
  // 3. Uppdatera status till "bokford"

  return { success: true };
}

// Hämta bokslutschecklista
export async function hamtaBokslutschecklista(period: string) {
  const userId = await requireAuth();

  // TODO: Implementera databaskoppling
  // SELECT * FROM bokslutschecklista WHERE user_id = ? AND period = ?

  return [
    { id: "1", uppgift: "Kontrollera alla verifikat är bokförda", klar: true },
    { id: "2", uppgift: "Genomför månadsavstämningar", klar: true },
    { id: "3", uppgift: "Kontrollera lagerinventering", klar: false },
    // ... fler uppgifter
  ];
}

// Uppdatera checklistepunkt
export async function uppdateraChecklistepunkt(id: string, klar: boolean) {
  const userId = await requireAuth();

  // TODO: Implementera databaskoppling
  // UPDATE bokslutschecklista SET klar = ? WHERE id = ? AND user_id = ?

  return { success: true };
}

// Generera årsredovisning (PDF)
export async function genereraArsredovisning(period: string) {
  const userId = await requireAuth();

  // TODO: Implementera logik för att:
  // 1. Hämta alla transaktioner för perioden
  // 2. Beräkna resultat- och balansräkning
  // 3. Generera PDF med årsredovisning

  return { success: true, filnamn: `arsredovisning_${period}.pdf` };
}

// Stäng period
export async function stangPeriod(period: string) {
  const userId = await requireAuth();

  // TODO: Implementera logik för att:
  // 1. Kontrollera att alla obligatoriska moment är klara
  // 2. Uppdatera period status till "stängd"
  // 3. Förhindra redigering av transaktioner i perioden

  return { success: true };
}

// Öppna period igen (endast för admin/under vissa förutsättningar)
export async function oppnaPeriod(period: string) {
  const userId = await requireAuth();

  // TODO: Implementera logik och säkerhetskontroller

  return { success: true };
}
