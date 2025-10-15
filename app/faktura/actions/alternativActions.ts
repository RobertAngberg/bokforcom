"use server";

import { pool } from "../../_lib/db";
import { ensureSession } from "../../_utils/session";
import {
  hamtaTransaktionsposter as hamtaTransaktionsposterUtil,
  TransaktionspostMedMeta,
} from "../../_utils/transactions";
import {
  registreraKundfakturaBetalning as registreraKundfakturaBetalningBase,
  registreraRotRutBetalning as registreraRotRutBetalningBase,
} from "./betalningActions";
import type { BokförFakturaData, TransaktionsPost } from "../types/types";
import { bokforFaktura as bokforFakturaBase } from "./bokforingActions";

// === BETALNINGSMETOD (från alternativActions.ts) ===
export async function hamtaSenasteBetalningsmetod(userId: string) {
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

export async function bokforFaktura(data: BokförFakturaData) {
  return bokforFakturaBase(data);
}

// === BOKFÖRING (från bokforingActions.ts) ===
export async function hamtaBokforingsmetod() {
  const { userId } = await ensureSession();

  try {
    const result = await pool.query('SELECT bokföringsmetod FROM "user" WHERE id = $1', [userId]);

    return result.rows[0]?.bokföringsmetod || "kontantmetoden";
  } catch (error) {
    console.error("Fel vid hämtning av bokföringsmetod:", error);
    return "kontantmetoden";
  }
}

export async function hamtaFakturaStatus(fakturaId: number): Promise<{
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

export async function sparaBokforingsmetod(metod: "kontantmetoden" | "fakturametoden") {
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

export async function hamtaBokfordaFakturor() {
  const { userId } = await ensureSession();

  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT * FROM fakturor 
       WHERE user_id = $1 AND status_bokförd = 'Bokförd'
       ORDER BY uppdaterad DESC`,
      [userId]
    );
    return { success: true, data: result.rows };
  } finally {
    client.release();
  }
}

export async function hamtaTransaktionsposter(transaktionId?: number): Promise<TransaktionsPost[]> {
  if (!transaktionId) {
    return [];
  }

  const poster = (await hamtaTransaktionsposterUtil(transaktionId, {
    meta: true,
  })) as TransaktionspostMedMeta[];

  return poster.map<TransaktionsPost>((rad) => ({
    id: rad.id,
    kontonummer: rad.kontonummer,
    kontobeskrivning: rad.kontobeskrivning,
    debet: rad.debet,
    kredit: rad.kredit,
    transaktionsdatum: rad.transaktionsdatum,
    transaktionskommentar: rad.transaktionskommentar ?? "",
  }));
}
