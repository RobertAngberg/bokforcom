"use server";

import { pool } from "../../_lib/db";
import { ensureSession } from "../../_utils/session";
import { revalidatePath } from "next/cache";
import type { AnställdInput, FormActionState, Företagsprofil } from "../types/types";

export async function hämtaAllaAnställda() {
  const { userId } = await ensureSession();

  try {
    const client = await pool.connect();

    const query = `
      SELECT * FROM anställda 
      WHERE user_id = $1 
      ORDER BY skapad DESC
    `;

    const result = await client.query(query, [userId]);
    client.release();
    return result.rows;
  } catch (error) {
    console.error("❌ hämtaAllaAnställda error:", error);
    return [];
  }
}

export async function hämtaAnställd(anställdId: number) {
  const { userId } = await ensureSession();

  try {
    const client = await pool.connect();

    const query = `
      SELECT * FROM anställda 
      WHERE id = $1 AND user_id = $2
    `;

    const result = await client.query(query, [anställdId, userId]);
    if (result.rows.length === 0) {
      client.release();
      return null; // Ingen anställd hittades
    }
    client.release();
    return result.rows[0] || null;
  } catch (error) {
    console.error("❌ hämtaAnställd error:", error);
    return null;
  }
}

// React 19 Form Action - tar emot FormData direkt
export async function sparaNyAnställdFormAction(
  prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  try {
    // Endast förnamn och efternamn krävs!
    const förnamn = formData.get("förnamn") as string;
    const efternamn = formData.get("efternamn") as string;

    if (!förnamn || !efternamn) {
      return { success: false, message: "Förnamn och efternamn är obligatoriska" };
    }

    // Extrahera alla fält från FormData (med fallback till tomma strängar)
    const data: AnställdInput = {
      förnamn,
      efternamn,
      namn: `${förnamn} ${efternamn}`.trim(),
      personnummer: (formData.get("personnummer") as string) || "",
      jobbtitel: (formData.get("jobbtitel") as string) || "",
      mail: (formData.get("mail") as string) || "",
      clearingnummer: (formData.get("clearingnummer") as string) || "",
      bankkonto: (formData.get("bankkonto") as string) || "",
      adress: (formData.get("adress") as string) || "",
      postnummer: (formData.get("postnummer") as string) || "",
      ort: (formData.get("ort") as string) || "",
      startdatum: (formData.get("startdatum") as string) || new Date().toISOString().split("T")[0],
      slutdatum:
        (formData.get("slutdatum") as string) ||
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      anställningstyp: (formData.get("anställningstyp") as string) || "",
      löneperiod: (formData.get("löneperiod") as string) || "",
      ersättningPer: (formData.get("ersättningPer") as string) || "",
      kompensation: (formData.get("kompensation") as string) || "",
      arbetsvecka_timmar: (formData.get("arbetsvecka") as string) || "",
      arbetsbelastning: (formData.get("arbetsbelastning") as string) || "",
      deltidProcent: (formData.get("deltidProcent") as string) || "",
      tjänsteställeAdress: (formData.get("tjänsteställeAdress") as string) || "",
      tjänsteställeOrt: (formData.get("tjänsteställeOrt") as string) || "",
      skattetabell: parseInt((formData.get("skattetabell") as string) || "0", 10),
      skattekolumn: parseInt((formData.get("skattekolumn") as string) || "0", 10),
      epost: (formData.get("epost") as string) || undefined,
    };

    // Anropa befintlig funktion
    const result = await sparaAnställd(data);

    if (result.success) {
      return { success: true, message: "Ny anställd sparad!" };
    } else {
      return { success: false, message: result.message || "Fel vid sparande" };
    }
  } catch (error) {
    console.error("❌ Form action error:", error);
    return { success: false, message: "Okänt fel vid sparande" };
  }
}

export async function sparaAnställd(data: AnställdInput, anställdId?: number | null) {
  const { userId } = await ensureSession();

  try {
    const client = await pool.connect();

    // Om anställdId finns - UPPDATERA, annars SKAPA NY
    if (anställdId) {
      // SÄKERHETSVALIDERING: Verifiera ägarskap
      const ownershipCheck = await client.query(
        "SELECT id FROM anställda WHERE id = $1 AND user_id = $2",
        [anställdId, userId]
      );

      if (ownershipCheck.rows.length === 0) {
        client.release();
        return {
          success: false,
          error: "Säkerhetsfel: Otillåten åtkomst till anställd",
        };
      }

      // UPPDATERA befintlig anställd med krypterad data
      const updateQuery = `
        UPDATE anställda SET
          förnamn = $1, efternamn = $2, personnummer = $3, jobbtitel = $4, mail = $5,
          clearingnummer = $6, bankkonto = $7, adress = $8, postnummer = $9, ort = $10,
          startdatum = $11, slutdatum = $12, anställningstyp = $13, löneperiod = $14, ersättning_per = $15,
          kompensation = $16, arbetsvecka_timmar = $17, arbetsbelastning = $18, deltid_procent = $19,
          tjänsteställe_adress = $20, tjänsteställe_ort = $21,
          skattetabell = $22, skattekolumn = $23,
          uppdaterad = NOW()
        WHERE id = $24 AND user_id = $25
        RETURNING id
      `;

      const values = [
        data.förnamn || null,
        data.efternamn || null,
        data.personnummer,
        data.jobbtitel || null,
        data.mail || null,
        data.clearingnummer || null,
        data.bankkonto || null,
        data.adress || null,
        data.postnummer || null,
        data.ort || null,
        data.startdatum || null,
        data.slutdatum || null,
        data.anställningstyp || null,
        data.löneperiod || null,
        data.ersättningPer || null,
        data.kompensation ? parseFloat(data.kompensation) : null,
        data.arbetsvecka_timmar ? parseInt(data.arbetsvecka_timmar, 10) : null,
        data.arbetsbelastning || null,
        data.deltidProcent ? parseInt(data.deltidProcent, 10) : null,
        data.tjänsteställeAdress || null,
        data.tjänsteställeOrt || null,
        data.skattetabell || null,
        data.skattekolumn || null,
        anställdId,
        userId,
      ];

      await client.query(updateQuery, values);
      client.release();
      revalidatePath("/personal");

      return {
        success: true,
        id: anställdId,
        message: "Anställd uppdaterad!",
      };
    } else {
      // SKAPA NY anställd
      const insertQuery = `
        INSERT INTO anställda (
          förnamn, efternamn, personnummer, jobbtitel, mail,
          clearingnummer, bankkonto, adress, postnummer, ort,
          startdatum, slutdatum, anställningstyp, löneperiod, ersättning_per,
          kompensation, arbetsvecka_timmar, arbetsbelastning, deltid_procent,
          tjänsteställe_adress, tjänsteställe_ort,
          skattetabell, skattekolumn,
          user_id
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15,
          $16, $17, $18, $19,
          $20, $21,
          $22, $23, $24
        ) RETURNING id
      `;

      const values = [
        data.förnamn || null,
        data.efternamn || null,
        data.personnummer,
        data.jobbtitel || null,
        data.mail || null,
        data.clearingnummer || null,
        data.bankkonto || null,
        data.adress || null,
        data.postnummer || null,
        data.ort || null,
        data.startdatum || null,
        data.slutdatum || null,
        data.anställningstyp || null,
        data.löneperiod || null,
        data.ersättningPer || null,
        data.kompensation ? parseFloat(data.kompensation) : null,
        data.arbetsvecka_timmar ? parseInt(data.arbetsvecka_timmar, 10) : null,
        data.arbetsbelastning || null,
        data.deltidProcent ? parseInt(data.deltidProcent, 10) : null,
        data.tjänsteställeAdress || null,
        data.tjänsteställeOrt || null,
        data.skattetabell || null,
        data.skattekolumn || null,
        userId,
      ];

      const result = await client.query(insertQuery, values);
      const nyAnställdId = result.rows[0].id;

      client.release();
      revalidatePath("/personal");

      return {
        success: true,
        id: nyAnställdId,
        message: "Anställd sparad!",
      };
    }
  } catch (error) {
    console.error("❌ sparaAnställd error:", error);
    return {
      success: false,
      error: "Kunde inte spara anställd: " + (error instanceof Error ? error.message : "Okänt fel"),
    };
  }
}

export async function taBortAnställd(anställdId: number) {
  const { userId } = await ensureSession();
  try {
    const client = await pool.connect();

    const query = `
      DELETE FROM anställda 
      WHERE id = $1 AND user_id = $2
    `;

    await client.query(query, [anställdId, userId]);

    client.release();
    revalidatePath("/personal");

    return {
      success: true,
      message: "Anställd borttagen!",
    };
  } catch (error) {
    console.error("❌ taBortAnställd error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Ett fel uppstod",
    };
  }
}

export async function hämtaFöretagsprofil(userId: string): Promise<Företagsprofil | null> {
  try {
    const { rows } = await pool.query(
      `
      SELECT
        företagsnamn,
        adress,
        postnummer,
        stad,
        organisationsnummer,
        momsregistreringsnummer,
        telefonnummer,
        epost,
        webbplats
      FROM företagsprofil
      WHERE id = $1
      LIMIT 1
      `,
      [userId]
    );

    return rows[0] || null;
  } catch (error) {
    console.error("Fel vid hämtning av företagsprofil:", error);
    return null;
  }
}
