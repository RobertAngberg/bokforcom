"use server";

import { pool } from "../../_lib/db";
import { ensureSession } from "../../_utils/session";
import { withDatabase } from "../../_utils/dbUtils";
import {
  registreraKundfakturaBetalning as registreraKundfakturaBetalningBase,
  registreraRotRutBetalning as registreraRotRutBetalningBase,
} from "./betalningActions";
import type { BokförFakturaData } from "../types/types";

// === BETALNINGSMETOD (från alternativActions.ts) ===
export async function hämtaSenasteBetalningsmetod(userId: string) {
  try {
    const result = await pool.query(
      `
      SELECT 
        betalningsmetod, 
        nummer
      FROM fakturor 
      WHERE "user_id" = $1 
        AND betalningsmetod IS NOT NULL 
        AND betalningsmetod != ''
        AND nummer IS NOT NULL
        AND nummer != ''
      ORDER BY id DESC
      LIMIT 1
    `,
      [userId]
    );

    if (result.rows.length === 0) {
      return { betalningsmetod: null, nummer: null };
    }

    const { betalningsmetod, nummer } = result.rows[0];
    return { betalningsmetod, nummer };
  } catch (error) {
    console.error("❌ Fel vid hämtning av senaste betalningsmetod:", error);
    return { betalningsmetod: null, nummer: null };
  }
}

// === BETALNINGAR (från betalningActions.ts) ===
export async function registreraKundfakturaBetalning(
  fakturaId: number,
  betalningsbelopp: number,
  kontoklass: string
): Promise<{ success: boolean; error?: string; transaktionsId?: number }> {
  return registreraKundfakturaBetalningBase(fakturaId, betalningsbelopp, kontoklass);
}

export async function uppdateraRotRutStatus(
  fakturaId: number,
  status: "ej_inskickad" | "väntar" | "godkänd"
) {
  const { userId } = await ensureSession();
  const client = await pool.connect();

  try {
    const result = await client.query(
      `UPDATE fakturor SET rot_rut_status = $1 WHERE id = $2 AND "user_id" = $3`,
      [status, fakturaId, userId]
    );

    if (result.rowCount === 0) {
      return { success: false, error: "Faktura hittades inte" };
    }

    return { success: true };
  } catch (error) {
    console.error("Fel vid uppdatering av ROT/RUT status:", error);
    return { success: false, error: "Kunde inte uppdatera status" };
  } finally {
    client.release();
  }
}

export async function registreraRotRutBetalning(
  fakturaId: number
): Promise<{ success: boolean; error?: string }> {
  return registreraRotRutBetalningBase(fakturaId);
}

// === BOKFÖRING (från bokforingActions.ts) ===
export async function hämtaBokföringsmetod() {
  const { userId } = await ensureSession();

  try {
    const result = await pool.query('SELECT bokföringsmetod FROM "user" WHERE id = $1', [userId]);

    return result.rows[0]?.bokföringsmetod || "kontantmetoden";
  } catch (error) {
    console.error("Fel vid hämtning av bokföringsmetod:", error);
    return "kontantmetoden";
  }
}

export async function hämtaFakturaStatus(fakturaId: number): Promise<{
  status_betalning?: string;
  status_bokförd?: string;
  betaldatum?: string;
}> {
  const { userId } = await ensureSession();

  try {
    const result = await pool.query(
      'SELECT status_betalning, status_bokförd, betaldatum FROM fakturor WHERE id = $1 AND "user_id" = $2',
      [fakturaId, userId]
    );
    return result.rows[0] || {};
  } catch (error) {
    console.error("Fel vid hämtning av fakturaSTATUS:", error);
    return {};
  }
}

export async function sparaBokföringsmetod(metod: "kontantmetoden" | "fakturametoden") {
  const { userId } = await ensureSession();

  try {
    await pool.query('UPDATE "user" SET bokföringsmetod = $1 WHERE id = $2', [metod, userId]);

    return { success: true };
  } catch (error) {
    console.error("Fel vid sparande av bokföringsmetod:", error);
    return { success: false, error: "Databasfel" };
  }
}

// Bokföringsfunktioner

export async function bokförFaktura(data: BokförFakturaData) {
  const { userId } = await ensureSession();

  return withDatabase(async (client) => {
    try {
      // Uppdatera fakturastatus
      await client.query(
        `UPDATE fakturor 
         SET 
           status_bokförd = 'Bokförd',
           uppdaterad = CURRENT_TIMESTAMP
         WHERE id = $1 AND user_id = $2`,
        [data.fakturaId, userId]
      );

      // Spara bokföringsposter om de finns
      if (data.poster && data.poster.length > 0) {
        for (const post of data.poster) {
          await client.query(
            `INSERT INTO bokforing_poster (
              user_id, faktura_id, konto, beskrivning, debet, kredit
            ) VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              userId,
              data.fakturaId,
              post.konto,
              post.beskrivning,
              post.debet || 0,
              post.kredit || 0,
            ]
          );
        }
      }

      return {
        success: true,
        message: `Faktura ${data.fakturanummer} har bokförts för ${data.kundnamn}`,
      };
    } catch (error) {
      console.error("Bokföringsfel:", error);
      return { success: false, error: "Databasfel vid bokföring" };
    }
  });
}

export async function hamtaBokfordaFakturor() {
  const { userId } = await ensureSession();

  return withDatabase(async (client) => {
    const result = await client.query(
      `SELECT * FROM fakturor 
       WHERE user_id = $1 AND status_bokförd = 'Bokförd'
       ORDER BY uppdaterad DESC`,
      [userId]
    );
    return { success: true, data: result.rows };
  });
}

export async function hamtaTransaktionsposter(fakturaId?: number) {
  const { userId } = await ensureSession();

  return withDatabase(async (client) => {
    let query = `
      SELECT t.*, f.fakturanummer, f.belopp 
      FROM transaktioner t
      LEFT JOIN fakturor f ON t.faktura_id = f.id
      WHERE t.user_id = $1
    `;
    const params: (string | number)[] = [userId];

    if (fakturaId) {
      query += " AND t.faktura_id = $2";
      params.push(fakturaId);
    }

    query += " ORDER BY t.datum DESC";

    const result = await client.query(query, params);
    return { success: true, data: result.rows };
  });
}
