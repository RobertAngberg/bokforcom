"use server";

import { pool } from "../../_lib/db";
import { ensureSession } from "../../_utils/session";

/**
 * Kontrollera om ett verifikat är en faktura och om den är betald
 */
export async function getFakturaStatus(transaktionsId: number): Promise<{
  ärFaktura: boolean;
  ärBetald: boolean;
  belopp?: number;
  fakturadatum?: string;
}> {
  const { userId } = await ensureSession();

  try {
    const client = await pool.connect();

    // Verifiera att transaktionen tillhör användaren
    const ownerCheck = await client.query(
      "SELECT id FROM transaktioner WHERE id = $1 AND user_id = $2",
      [transaktionsId, userId]
    );

    if (ownerCheck.rows.length === 0) {
      client.release();
      return { ärFaktura: false, ärBetald: false };
    }

    // Kolla om verifikatet innehåller 1510 (Kundfordringar) på debetsidan
    const fakturaCheck = await client.query(
      `
      SELECT tp.debet, t.transaktionsdatum
      FROM transaktionsposter tp
      JOIN konton k ON tp.konto_id = k.id
      JOIN transaktioner t ON tp.transaktions_id = t.id
      WHERE tp.transaktions_id = $1 
        AND k.kontonummer = '1510'
        AND tp.debet > 0
      `,
      [transaktionsId]
    );

    if (fakturaCheck.rows.length === 0) {
      client.release();
      return { ärFaktura: false, ärBetald: false };
    }

    const belopp = parseFloat(fakturaCheck.rows[0].debet);
    const fakturadatum = fakturaCheck.rows[0].transaktionsdatum;

    // Kolla om det finns ett senare verifikat som kreditar 1510 med samma belopp
    // Detta indikerar att fakturan har betalats
    const betalningCheck = await client.query(
      `
      SELECT tp.kredit
      FROM transaktionsposter tp
      JOIN konton k ON tp.konto_id = k.id
      JOIN transaktioner t ON tp.transaktions_id = t.id
      WHERE t.user_id = $1
        AND t.transaktionsdatum >= $2
        AND k.kontonummer = '1510'
        AND tp.kredit = $3
        AND tp.transaktions_id != $4
      ORDER BY t.transaktionsdatum ASC, t.id ASC
      LIMIT 1
      `,
      [userId, fakturadatum, belopp, transaktionsId]
    );

    const ärBetald = betalningCheck.rows.length > 0;

    client.release();

    return {
      ärFaktura: true,
      ärBetald,
      belopp,
      fakturadatum,
    };
  } catch (error) {
    console.error("Fel vid kontroll av fakturastatus:", error);
    return { ärFaktura: false, ärBetald: false };
  }
}

/**
 * Registrera betalning för en faktura
 * Skapar ett nytt verifikat: Debet 1930 (Företagskonto) → Kredit 1510 (Kundfordringar)
 */
export async function registreraBetalning(
  transaktionsId: number,
  betaldatum: string
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  nyTransaktionsId?: number;
}> {
  const { userId } = await ensureSession();

  try {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Hämta fakturainformation
      const fakturaInfo = await client.query(
        `
        SELECT tp.debet, t.transaktionsdatum, t.kommentar
        FROM transaktionsposter tp
        JOIN konton k ON tp.konto_id = k.id
        JOIN transaktioner t ON tp.transaktions_id = t.id
        WHERE tp.transaktions_id = $1 
          AND t.user_id = $2
          AND k.kontonummer = '1510'
          AND tp.debet > 0
        `,
        [transaktionsId, userId]
      );

      if (fakturaInfo.rows.length === 0) {
        await client.query("ROLLBACK");
        client.release();
        return { success: false, error: "Faktura hittades inte" };
      }

      const belopp = parseFloat(fakturaInfo.rows[0].debet);

      // Kontrollera att fakturan inte redan är betald
      const status = await getFakturaStatus(transaktionsId);
      if (status.ärBetald) {
        await client.query("ROLLBACK");
        client.release();
        return { success: false, error: "Fakturan är redan betald" };
      }

      // Hämta konto-id för 1930 och 1510
      const kontonResult = await client.query(
        `
        SELECT id, kontonummer 
        FROM konton 
        WHERE kontonummer IN ('1930', '1510')
        ORDER BY kontonummer
        `,
        []
      );

      if (kontonResult.rows.length !== 2) {
        await client.query("ROLLBACK");
        client.release();
        return { success: false, error: "Kunde inte hitta nödvändiga konton (1930, 1510)" };
      }

      const konto1510 = kontonResult.rows.find((k) => k.kontonummer === "1510");
      const konto1930 = kontonResult.rows.find((k) => k.kontonummer === "1930");

      if (!konto1510 || !konto1930) {
        await client.query("ROLLBACK");
        client.release();
        return { success: false, error: "Kunde inte hitta nödvändiga konton" };
      }

      // Skapa nytt verifikat för betalning
      const kommentar = `Betalning faktura #${transaktionsId}`;
      const kontobeskrivning = `Kundbetalning`;

      const transaktionResult = await client.query(
        `
        INSERT INTO transaktioner 
          (transaktionsdatum, kontobeskrivning, belopp, kommentar, user_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
        `,
        [betaldatum, kontobeskrivning, belopp, kommentar, userId]
      );

      const nyTransaktionsId = transaktionResult.rows[0].id;

      // Skapa transaktionsposter
      // Debet: 1930 Företagskonto
      await client.query(
        `
        INSERT INTO transaktionsposter (transaktions_id, konto_id, debet, kredit)
        VALUES ($1, $2, $3, 0)
        `,
        [nyTransaktionsId, konto1930.id, belopp]
      );

      // Kredit: 1510 Kundfordringar
      await client.query(
        `
        INSERT INTO transaktionsposter (transaktions_id, konto_id, debet, kredit)
        VALUES ($1, $2, 0, $3)
        `,
        [nyTransaktionsId, konto1510.id, belopp]
      );

      await client.query("COMMIT");
      client.release();

      return {
        success: true,
        message: `Betalning registrerad! Nytt verifikat skapat.`,
        nyTransaktionsId,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      client.release();
      console.error("Fel vid registrering av betalning:", error);
      return { success: false, error: "Kunde inte registrera betalning" };
    }
  } catch (error) {
    console.error("Databasfel vid registrering av betalning:", error);
    return { success: false, error: "Databasfel" };
  }
}
