"use server";

import { pool } from "../../_lib/db";
import { ensureSession } from "../../_utils/session";
import { createTransaktion } from "../../_utils/transactions";

export async function registreraKundfakturaBetalning(
  fakturaId: number,
  betalningsbelopp: number,
  kontoklass: string
): Promise<{ success: boolean; error?: string; transaktionsId?: number }> {
  const { userId } = await ensureSession();

  if (!Number.isFinite(betalningsbelopp) || betalningsbelopp <= 0) {
    return { success: false, error: "Ogiltigt betalningsbelopp" };
  }

  try {
    // Hämta fakturauppgifter och artiklar
    const fakturaResult = await pool.query(
      'SELECT * FROM fakturor WHERE id = $1 AND "user_id" = $2',
      [fakturaId, userId]
    );

    if (fakturaResult.rows.length === 0) {
      return { success: false, error: "Faktura hittades inte" };
    }

    const faktura = fakturaResult.rows[0];

    // Kontrollera att fakturan är en kundfaktura och inte redan betald
    const statusBetalning = (faktura.status_betalning || "").toLowerCase();
    if (faktura.typ !== "kund" || statusBetalning === "betald") {
      return { success: false, error: "Fakturan kan inte betalas" };
    }

    // Kolla om fakturan har ROT/RUT-artiklar
    const artiklarResult = await pool.query(
      "SELECT rot_rut_typ FROM faktura_artiklar WHERE faktura_id = $1",
      [fakturaId]
    );

    const harRotRut = artiklarResult.rows.some((row) => row.rot_rut_typ);

    const bankKonto = kontoklass === "1930" ? "1930" : "1910";
    const today = new Date();
    const todayISO = today.toISOString().split("T")[0];
    const kommentarSuffix = harRotRut ? " (kundens del)" : "";

    let transaktionsId: number | undefined;

    try {
      const { transaktionsId: createdId } = await createTransaktion({
        datum: today,
        beskrivning: `Betalning kundfaktura ${faktura.fakturanummer}`,
        kommentar: `Betalning kundfaktura ${faktura.fakturanummer}${kommentarSuffix}`,
        userId,
        poster: [
          { kontonummer: bankKonto, debet: betalningsbelopp, kredit: 0 },
          { kontonummer: "1510", debet: 0, kredit: betalningsbelopp },
        ],
      });

      transaktionsId = createdId;

      await pool.query(
        'UPDATE fakturor SET status_betalning = $1, betaldatum = $2, transaktions_id = $3 WHERE id = $4 AND "user_id" = $5',
        ["Betald", todayISO, transaktionsId, fakturaId, userId]
      );

      return {
        success: true,
        transaktionsId,
      };
    } catch (error) {
      if (transaktionsId !== undefined) {
        try {
          await pool.query('DELETE FROM transaktioner WHERE id = $1 AND "user_id" = $2', [
            transaktionsId,
            userId,
          ]);
        } catch (cleanupError) {
          console.error("⚠️ Kunde inte rulla tillbaka kundfakturatransaktion:", cleanupError);
        }
      }

      throw error;
    }
  } catch (error) {
    console.error("Fel vid registrering av kundfakturabetalning:", error);
    return {
      success: false,
      error: "Kunde inte registrera betalning",
    };
  }
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
  const { userId } = await ensureSession();

  try {
    // Hämta faktura för att kolla ROT/RUT-belopp
    const fakturaResult = await pool.query(
      'SELECT * FROM fakturor WHERE id = $1 AND "user_id" = $2',
      [fakturaId, userId]
    );

    if (fakturaResult.rows.length === 0) {
      return { success: false, error: "Faktura hittades inte" };
    }

    const faktura = fakturaResult.rows[0];

    // Kolla om fakturan har ROT/RUT-artiklar
    const artiklarResult = await pool.query(
      "SELECT * FROM faktura_artiklar WHERE faktura_id = $1 AND rot_rut_typ IS NOT NULL",
      [fakturaId]
    );

    if (artiklarResult.rows.length === 0) {
      return { success: false, error: "Inga ROT/RUT-artiklar hittades" };
    }

    // Beräkna totalt ROT/RUT-belopp (50% av fakturasumman)
    const totalArtiklarResult = await pool.query(
      "SELECT SUM(antal * pris_per_enhet * (1 + moms/100)) as total FROM faktura_artiklar WHERE faktura_id = $1",
      [fakturaId]
    );

    const totalBelopp = totalArtiklarResult.rows[0].total || 0;
    const rotRutBelopp = Math.round(totalBelopp * 0.5 * 100) / 100; // 50% avrundad

    if (!Number.isFinite(rotRutBelopp) || rotRutBelopp <= 0) {
      return { success: false, error: "Ogiltigt ROT/RUT-belopp" };
    }

    const today = new Date();
    const todayISO = today.toISOString().split("T")[0];
    let transaktionsId: number | undefined;

    try {
      const { transaktionsId: createdId } = await createTransaktion({
        datum: today,
        beskrivning: `ROT/RUT-betalning faktura ${faktura.fakturanummer}`,
        kommentar: `ROT/RUT-utbetalning från Skatteverket för faktura ${faktura.fakturanummer}`,
        userId,
        poster: [
          { kontonummer: "1930", debet: rotRutBelopp, kredit: 0 },
          { kontonummer: "1513", debet: 0, kredit: rotRutBelopp },
        ],
      });

      transaktionsId = createdId;

      await pool.query(
        'UPDATE fakturor SET status_betalning = $1, betaldatum = $2 WHERE id = $3 AND "user_id" = $4',
        ["Betald", todayISO, fakturaId, userId]
      );

      return { success: true };
    } catch (error) {
      if (transaktionsId !== undefined) {
        try {
          await pool.query('DELETE FROM transaktioner WHERE id = $1 AND "user_id" = $2', [
            transaktionsId,
            userId,
          ]);
        } catch (cleanupError) {
          console.error("⚠️ Kunde inte rulla tillbaka ROT/RUT-transaktion:", cleanupError);
        }
      }

      throw error;
    }
  } catch (error) {
    console.error("Fel vid registrering av ROT/RUT-betalning:", error);
    return { success: false, error: "Kunde inte registrera ROT/RUT-betalning" };
  }
}
