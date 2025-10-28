"use server";

import { pool } from "../../_lib/db";
import { auth } from "../../_lib/better-auth";
import { headers } from "next/headers";
import { OnboardingData } from "../types/types";

/**
 * Spara onboarding-data och markera användaren som klar
 */
export async function completeOnboarding(data: OnboardingData) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Ingen session hittades" };
    }

    const userId = session.user.id;

    // Validera organisationsnummer (10 siffror)
    const orgNrCleaned = data.organisationsnummer.replace(/\D/g, "");
    if (orgNrCleaned.length !== 10) {
      return { success: false, error: "Organisationsnummer måste vara 10 siffror" };
    }

    // Validera företagsnamn
    if (!data.företagsnamn || data.företagsnamn.trim().length < 2) {
      return { success: false, error: "Företagsnamn måste vara minst 2 tecken" };
    }

    // Uppdatera användaren
    await pool.query(
      `UPDATE "user" 
       SET organisationsnummer = $1,
           företagsnamn = $2,
           bokföringsmetod = $3,
           momsperiod = $4,
           onboarding_completed = true,
           "updatedAt" = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [orgNrCleaned, data.företagsnamn.trim(), data.bokföringsmetod, data.momsperiod, userId]
    );

    return { success: true };
  } catch (error) {
    console.error("Fel vid onboarding:", error);
    return { success: false, error: "Kunde inte spara företagsinformation" };
  }
}

/**
 * Kontrollera om användaren har genomfört onboarding
 */
export async function checkOnboardingStatus() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { completed: false, needsOnboarding: false, notLoggedIn: true };
    }

    const result = await pool.query(
      `SELECT onboarding_completed, organisationsnummer, företagsnamn, bokföringsmetod, momsperiod
       FROM "user"
       WHERE id = $1`,
      [session.user.id]
    );

    if (result.rows.length === 0) {
      return { completed: false, needsOnboarding: true };
    }

    const user = result.rows[0];
    const completed = user.onboarding_completed === true;

    return {
      completed,
      needsOnboarding: !completed,
      data: completed
        ? {
            organisationsnummer: user.organisationsnummer,
            företagsnamn: user.företagsnamn,
            bokföringsmetod: user.bokföringsmetod,
            momsperiod: user.momsperiod,
          }
        : null,
    };
  } catch (error) {
    console.error("Fel vid kontroll av onboarding-status:", error);
    return { completed: false, needsOnboarding: true };
  }
}
