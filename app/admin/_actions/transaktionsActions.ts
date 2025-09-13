"use server";

import { ensureSession } from "../../_utils/session";
import { query, queryOne } from "../../_utils/dbUtils";
import { hamtaTransaktionsposter as hamtaTransaktionsposterCore } from "../../_utils/transaktioner/hamtaTransaktionsposter";
import { validateId, sanitizeFormInput } from "../../_utils/validationUtils";
import { logError } from "../../_utils/errorUtils";

// ============================================================================
// Transaktionsposter
// ============================================================================

export async function hamtaTransaktionsposter(transaktionsId: number) {
  try {
    if (!validateId(transaktionsId)) return [];
    const poster = await hamtaTransaktionsposterCore(transaktionsId);
    return poster.map((p) => ({
      kontonummer: p.kontonummer,
      kontobeskrivning: p.kontobeskrivning,
      debet: p.debet,
      kredit: p.kredit,
    }));
  } catch (error) {
    logError(error as Error, "hamtaTransaktionsposter");
    return [];
  }
}

// ============================================================================
// Förval
// ============================================================================

export async function fetchAllaForval(filters?: { sok?: string; kategori?: string; typ?: string }) {
  try {
    await ensureSession();

    let base = "SELECT * FROM forval";
    const values: any[] = [];
    const conditions: string[] = [];

    if (filters?.sok) {
      const term = sanitizeFormInput(filters.sok.toLowerCase());
      conditions.push(
        `(LOWER(namn) LIKE $${values.length + 1} OR LOWER(beskrivning) LIKE $${values.length + 1})`
      );
      values.push(`%${term}%`);
    }

    if (filters?.kategori) {
      conditions.push(`kategori = $${values.length + 1}`);
      values.push(filters.kategori);
    }

    if (filters?.typ) {
      conditions.push(`typ = $${values.length + 1}`);
      values.push(filters.typ);
    }

    if (conditions.length > 0) {
      base += ` WHERE ${conditions.join(" AND ")}`;
    }

    base += " ORDER BY namn ASC";

    const res = await query(base, values);
    return res.rows;
  } catch (error) {
    logError(error as Error, "fetchAllaForval");
    return [];
  }
}

// ============================================================================
// Fakturanummer
// ============================================================================

export async function uppdateraFakturanummer(id: number, nyttNummer: string) {
  try {
    await ensureSession();
    if (!validateId(id)) return { success: false, error: "Ogiltigt ID" };

    const cleaned = sanitizeFormInput(nyttNummer).toUpperCase();
    const updated = await queryOne(
      "UPDATE fakturamallar SET fakturanummer = $1 WHERE id = $2 RETURNING *",
      [cleaned, id]
    );

    return { success: true, data: updated };
  } catch (error) {
    logError(error as Error, "uppdateraFakturanummer");
    return { success: false, error: (error as Error).message };
  }
}
