"use server";

import { Pool } from "pg";
import { ensureSession } from "../../_utils/session";
import { dateTillÅÅÅÅMMDD } from "../../_utils/datum";
import { decodeSieFile } from "../utils/encoding";
import { classifyAccount } from "../utils/accounts";
import { sieDateToISO } from "../utils/dateFormatting";
import { parseSieContent } from "../utils/parser";
import { extractUsedAccounts, analyseMissingAccounts } from "../utils/accountAnalysis";
import { validateFileSize } from "../utils/validation";
import {
  convertToDebetKredit,
  isVerificationBalanced,
  isBalanceAccount,
} from "../utils/accounting";
import { calculateYearlyBalances } from "../utils/balanceCalculation";
import { buildSieHeader } from "../utils/sieBuilder";
import { groupTransactionsByVerification } from "../utils/verificationGrouping";
import { findDuplicateAccounts, removeDuplicatesForAccount } from "../utils/duplicateChecker";
import { createImportLogEntry } from "../utils/importLogger";
import { createBalanceTransaction } from "../utils/transactionCreator";
import type {
  SieData,
  ImportSettings,
  Verification,
  SieDiagnosticEntry,
  TransactionRow,
  CompanyInfo,
  AccountInfo,
  TransactionRowForGrouping,
  FileInfo,
  SieUploadResult,
} from "../types/types";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const isDev = process.env.NODE_ENV !== "production";
const debugSie = (...args: Parameters<typeof console.debug>) => {
  if (isDev) {
    console.debug(...args);
  }
};

export async function uploadSieFile(formData: FormData): Promise<SieUploadResult> {
  try {
    // 🔒 SÄKERHETSVALIDERING - Session
    await ensureSession();

    const file = formData.get("file") as File;

    if (!file) {
      return { success: false, error: "Ingen fil vald" };
    }

    // 🔒 FILVALIDERING
    const sizeError = validateFileSize(file.size);
    if (sizeError) {
      return { success: false, error: sizeError };
    }

    // Validera filtyp
    if (
      !file.name.toLowerCase().endsWith(".se4") &&
      !file.name.toLowerCase().endsWith(".sie") &&
      !file.name.toLowerCase().endsWith(".se")
    ) {
      return { success: false, error: "Endast SIE-filer (.sie, .se4, .se) stöds" };
    }

    const arrayBuffer = await file.arrayBuffer();

    const debugEncoding = process.env.NODE_ENV !== "production";
    const { content, encoding, formatTag, diagnostics } = decodeSieFile(arrayBuffer, {
      debug: debugEncoding,
    });

    if (debugEncoding) {
      diagnostics.forEach(({ message, data }: SieDiagnosticEntry) => {
        if (data === undefined || data === null) {
          debugSie(`🔍 SIE decode: ${message}`);
          return;
        }

        if (typeof data === "string" && data.length > 300) {
          debugSie(`🔍 SIE decode: ${message}`, `${data.slice(0, 300)}…`);
        } else {
          debugSie(`🔍 SIE decode: ${message}`, data);
        }
      });

      debugSie("📦 SIE decoding summary", {
        encoding,
        formatTag,
        length: content.length,
      });
    }

    // Parsa SIE-data
    const sieData = parseSieContent(content);

    // Kontrollera vilka konton som saknas i databasen
    const sieKonton = sieData.konton.map((k) => k.nummer);

    // Hitta konton som faktiskt används i transaktioner
    const anvandaKonton = extractUsedAccounts(sieData);

    // Kontrollera vilka konton som saknas i databasen (globalt)
    const { saknade, analys } = await kontrollSaknade(sieKonton, Array.from(anvandaKonton));

    return {
      success: true,
      data: sieData,
      saknade: saknade,
      analys: analys,
    };
  } catch (error) {
    console.error("Fel vid parsning av SIE-fil:", error);
    return { success: false, error: "Kunde inte läsa SIE-filen" };
  }
}

async function kontrollSaknade(sieKonton: string[], anvandaKonton?: string[]) {
  try {
    // Use existing pool from top-level import
    const client = await pool.connect();

    // Hämta ALLA konton (konton är globala, inte användarspecifika)
    const query = "SELECT kontonummer FROM konton";
    const { rows } = await client.query<{ kontonummer: string }>(query);
    const befintligaKonton = new Set(rows.map((r) => r.kontonummer.toString()));

    client.release();

    console.log(
      `📊 Kontokontroll - Befintliga konton: ${befintligaKonton.size}, SIE-konton: ${sieKonton.length}`
    );
    console.log(`📋 Några befintliga konton:`, Array.from(befintligaKonton).slice(0, 10));
    console.log(`📋 Några SIE-konton:`, sieKonton.slice(0, 10));

    // Analysera saknade konton
    const {
      allaSaknade,
      standardKonton,
      specialKonton,
      kritiskaKonton,
      anvandaSaknade,
      saknadeAttVisa,
    } = analyseMissingAccounts(sieKonton, befintligaKonton, anvandaKonton);

    // Logga saknade konton som faktiskt används
    if (anvandaKonton) {
      allaSaknade.forEach((kontoStr) => {
        if (anvandaKonton.includes(kontoStr)) {
          console.log(`❌ ANVÄNT Konto ${kontoStr} saknas i databasen`);
        }
      });
    }

    console.log(`🔍 Totalt saknade konton: ${allaSaknade.length}`, allaSaknade.slice(0, 10));

    const analys = {
      totaltAntal: allaSaknade.length,
      standardKonton: standardKonton.length,
      specialKonton: specialKonton.length,
      kritiskaKonton: kritiskaKonton,
      anvandaSaknade: anvandaSaknade.length,
      totaltAnvanda: anvandaKonton ? anvandaKonton.length : 0,
    };

    console.log(
      `🎯 Resultat - Saknade konton att visa: ${saknadeAttVisa.length}`,
      saknadeAttVisa.slice(0, 5)
    );
    console.log(
      `📊 Analys - Specialkonton: ${specialKonton.length}, Använda saknade: ${anvandaSaknade.length}`
    );

    return {
      saknade: saknadeAttVisa,
      analys: analys,
    };
  } catch (error) {
    console.error("❌ Fel vid kontroll av saknade konton:", error);
    return {
      saknade: [],
      analys: {
        totaltAntal: 0,
        standardKonton: 0,
        specialKonton: 0,
        kritiskaKonton: [],
        anvandaSaknade: 0,
        totaltAnvanda: 0,
      },
    };
  }
}

export async function skapaKonton(
  kontoData: Array<{ nummer: string; namn: string }>
): Promise<{ success: boolean; error?: string; skapade?: number }> {
  try {
    // 🔒 SÄKERHETSVALIDERING - Session
    await ensureSession();

    // Use existing pool from top-level import
    const client = await pool.connect();

    // Först, kontrollera vilka konton som redan finns (konton är globala)
    const befintligaQuery = "SELECT kontonummer FROM konton";
    const { rows: befintliga } = await client.query<{ kontonummer: string }>(befintligaQuery);
    const befintligaKonton = new Set(befintliga.map((r) => r.kontonummer.toString()));

    console.log(`🔍 Befintliga konton i systemet:`, befintligaKonton.size);

    let skapadeAntal = 0;
    let hoppadeOver = 0;

    for (const konto of kontoData) {
      try {
        const kontoStr = konto.nummer.toString().trim();

        // Kontrollera om kontot redan finns
        if (befintligaKonton.has(kontoStr)) {
          console.log(`⚠️ Konto ${kontoStr} finns redan, hoppar över`);
          hoppadeOver++;
          continue;
        }

        // Bestäm kontoklass baserat på kontonummer
        const { kontoklass, kategori } = classifyAccount(konto.nummer);

        // Skapa konto globalt (inga användarspecifika konton)
        const insertResult = await client.query(
          `INSERT INTO konton (kontonummer, beskrivning, kontoklass, kategori, sökord) 
           VALUES ($1, $2, $3, $4, $5) 
           ON CONFLICT (kontonummer) DO NOTHING
           RETURNING kontonummer`,
          [konto.nummer, konto.namn, kontoklass, kategori, [konto.namn.toLowerCase()]]
        );

        if (insertResult.rows.length > 0) {
          console.log(`✅ Skapade konto ${kontoStr}: ${konto.namn}`);
          skapadeAntal++;
          befintligaKonton.add(kontoStr); // Lägg till i cache
        } else {
          console.log(`⚠️ Konto ${kontoStr} kunde inte skapas (redan finns?))`);
          hoppadeOver++;
        }
      } catch (error) {
        console.error(`Fel vid skapande av konto ${konto.nummer}:`, error);
      }
    }

    client.release();

    console.log(`📊 Kontoskapande klart - Skapade: ${skapadeAntal}, Hoppade över: ${hoppadeOver}`);

    return {
      success: true,
      skapade: skapadeAntal,
    };
  } catch (error) {
    console.error("Fel vid skapande av konton:", error);
    return {
      success: false,
      error: "Kunde inte skapa konton",
    };
  }
}

// Ny funktion för att importera SIE-data
// ImportSettings type definition moved to ./types.ts

export async function importeraSieData(
  sieData: SieData,
  saknadeKonton: string[],
  settings: ImportSettings,
  fileInfo?: {
    filnamn: string;
    filstorlek: number;
  }
): Promise<{
  success: boolean;
  error?: string;
  resultat?: {
    kontonSkapade: number;
    verifikationerImporterade: number;
    balanserImporterade: number;
    resultatImporterat: number;
  };
}> {
  try {
    // 🔒 SÄKERHETSVALIDERING - Session
    const { userId } = await ensureSession();

    // Use existing pool from top-level import
    let client;
    let clientReleased = false;
    let importId = null;

    try {
      client = await pool.connect();

      // STEG 0: Skapa import-logg FÖRST
      if (fileInfo) {
        importId = await createImportLogEntry(client, userId, fileInfo as FileInfo, sieData);
      }

      // STEG 1: Kontrollera duplicates
      if (settings.inkluderaVerifikationer && sieData.verifikationer.length > 0) {
        const verifikationsNamn = sieData.verifikationer.map(
          (v: Verification) => `Verifikation ${v.serie}:${v.nummer}`
        );

        const { rows: duplicateRows } = await client.query(
          `SELECT kontobeskrivning, transaktionsdatum 
           FROM transaktioner 
           WHERE kontobeskrivning = ANY($1) 
           AND "user_id" = $2 
           AND kommentar LIKE 'SIE Import%'`,
          [verifikationsNamn, userId]
        );

        if (duplicateRows.length > 0) {
          const duplicatesList = duplicateRows
            .map(
              (row: { kontobeskrivning: string; transaktionsdatum: Date }) =>
                `• ${row.kontobeskrivning} (${dateTillÅÅÅÅMMDD(row.transaktionsdatum)})`
            )
            .join("\n");

          // Uppdatera import-logg med duplikat-fel
          if (importId) {
            await client.query(
              `
              UPDATE sie_importer SET
                status = 'misslyckad',
                felmeddelande = 'Duplicata verifikationer upptäckta',
                uppdaterad = NOW()
              WHERE id = $1
            `,
              [importId]
            );
          }

          // Release client
          client.release();
          clientReleased = true;

          return {
            success: false,
            error: `🚨 Import avbruten - Duplicata verifikationer upptäckta!

Följande verifikationer finns redan i din databas:

${duplicatesList}

💡 Detta förhindrar oavsiktliga dubbletter. Om du vill importera ändå, ta först bort de befintliga verifikationerna.`,
          };
        }
      }

      // Nu börja transaktion
      await client.query("BEGIN");

      const resultat = {
        kontonSkapade: 0,
        verifikationerImporterade: 0,
        balanserImporterade: 0,
        resultatImporterat: 0,
      };

      // Steg 2: Hitta ALLA använda konton som saknas (inte bara specialkonton)
      if (settings.skapaKonton) {
        // Samla alla konton som faktiskt används i SIE-filen
        const anvandaKonton = new Set<string>();
        sieData.verifikationer.forEach((ver) => {
          ver.transaktioner.forEach((trans) => {
            anvandaKonton.add(trans.konto);
          });
        });
        sieData.balanser.ingående.forEach((b) => anvandaKonton.add(b.konto));
        sieData.balanser.utgående.forEach((b) => anvandaKonton.add(b.konto));
        sieData.resultat.forEach((r) => anvandaKonton.add(r.konto));

        // Kontrollera vilka av dessa som saknas i databasen
        const { rows } = await client.query<{ kontonummer: string }>(
          "SELECT kontonummer FROM konton"
        );
        const befintligaKonton = new Set(rows.map((r) => r.kontonummer.toString()));

        const allaAnvandaSaknade = Array.from(anvandaKonton).filter(
          (konto) => !befintligaKonton.has(konto)
        );

        // Skapa ALLA använda saknade konton (både BAS-standard och specialkonton)
        for (const kontonummer of allaAnvandaSaknade) {
          const kontoInfo = sieData.konton.find((k) => k.nummer === kontonummer);
          const kontoNamn = kontoInfo?.namn || `Konto ${kontonummer}`;

          const { kontoklass, kategori } = classifyAccount(kontonummer);

          const insertResult = await client.query(
            `INSERT INTO konton (kontonummer, beskrivning, kontoklass, kategori, sökord) 
             VALUES ($1, $2, $3, $4, $5) 
             ON CONFLICT (kontonummer) DO NOTHING
             RETURNING id`,
            [kontonummer, kontoNamn, kontoklass, kategori, [kontoNamn.toLowerCase()]]
          );

          if (insertResult.rows.length > 0) {
            resultat.kontonSkapade++;
          }
        }
      }

      // Steg 2: Importera verifikationer
      if (settings.inkluderaVerifikationer) {
        let filtradeVerifikationer = sieData.verifikationer;

        // Filtrera på datum om specificerat - konvertera SIE-datum till jämförbart format
        if (settings.startDatum || settings.slutDatum) {
          filtradeVerifikationer = sieData.verifikationer.filter((v: Verification) => {
            const verifikationsDatum = sieDateToISO(v.datum);

            if (settings.startDatum && verifikationsDatum < settings.startDatum) return false;
            if (settings.slutDatum && verifikationsDatum > settings.slutDatum) return false;
            return true;
          });
        }

        // Filtrera bort användarvalde verifikationer
        if (settings.exkluderaVerifikationer && settings.exkluderaVerifikationer.length > 0) {
          const ursprungligAntal = filtradeVerifikationer.length;
          filtradeVerifikationer = filtradeVerifikationer.filter((v: Verification) => {
            const verifikationId = `${v.serie}-${v.nummer}`;
            const shouldExclude =
              settings.exkluderaVerifikationer?.includes(verifikationId) || false;
            if (shouldExclude) {
              console.log(
                `⚠️ Exkluderar verifikation V${v.nummer}: "${v.beskrivning}" (användarval)`
              );
            }
            return !shouldExclude;
          });
          console.log(
            `📊 Exkluderade ${ursprungligAntal - filtradeVerifikationer.length} verifikationer baserat på användarval`
          );
        }

        console.log(`📊 Antal verifikationer att importera: ${filtradeVerifikationer.length}`);

        // Importera varje verifikation som en transaktion med flera transaktionsposter
        for (const verifikation of filtradeVerifikationer) {
          // Konvertera SIE-datum till PostgreSQL-datum
          const transaktionsDatum = sieDateToISO(verifikation.datum);

          // Skapa huvudtransaktion
          const { rows: transaktionRows } = await client.query(
            `INSERT INTO transaktioner (
              transaktionsdatum, 
              kontobeskrivning, 
              kommentar, 
              "user_id"
            ) VALUES ($1, $2, $3, $4)
            RETURNING id`,
            [
              transaktionsDatum,
              `Verifikation ${verifikation.serie}:${verifikation.nummer}`,
              `SIE Import - ${verifikation.beskrivning}`,
              userId,
            ]
          );

          const transaktionsId = transaktionRows[0].id;

          // Skapa transaktionsposter för varje konto i verifikationen
          for (const transaktion of verifikation.transaktioner) {
            // Hämta konto_id från konton-tabellen
            const { rows: kontoRows } = await client.query(
              "SELECT id FROM konton WHERE kontonummer = $1",
              [transaktion.konto]
            );

            if (kontoRows.length === 0) {
              console.warn(`Konto ${transaktion.konto} hittades inte i konton-tabellen`);
              continue;
            }

            const kontoId = kontoRows[0].id;

            // Bestäm debet/kredit baserat på beloppets tecken
            const { debet, kredit } = convertToDebetKredit(transaktion.belopp);

            // Debug-logg för G:12 specifikt
            if (verifikation.serie === "G" && verifikation.nummer === "12") {
              console.log(`🔍 G:12 transaktion insert:`, {
                konto: transaktion.konto,
                beloppOriginal: transaktion.belopp,
                debet: debet,
                kredit: kredit,
                kontoId: kontoId,
              });
            }

            await client.query(
              `INSERT INTO transaktionsposter (
                transaktions_id,
                konto_id,
                debet,
                kredit
              ) VALUES ($1, $2, $3, $4)`,
              [transaktionsId, kontoId, debet, kredit]
            );
          }

          resultat.verifikationerImporterade++;
        }
      }

      // Steg 3: Importera balanser (om aktiverat)
      if (settings.inkluderaBalanser) {
        let ingaendeImporterade = 0;

        // ALLTID importera ingående balanser (föregående års slutbalans)
        if (sieData.balanser.ingående.length > 0) {
          console.log("📥 Importerar ingående balanser (föregående års slutbalans)");
          console.log("📊 Ingående balanser i SIE-fil:", sieData.balanser.ingående);

          ingaendeImporterade = await createBalanceTransaction(
            client,
            userId,
            sieData.balanser.ingående,
            settings.startDatum || `${new Date().getFullYear()}-01-01`,
            "Ingående balanser",
            "SIE Import - Ingående balanser"
          );
        }

        // Endast importera utgående balanser om INGA verifikationer finns
        if (sieData.verifikationer.length === 0 && sieData.balanser.utgående.length > 0) {
          console.log("📤 Importerar utgående balanser (eftersom inga verifikationer finns)");

          await createBalanceTransaction(
            client,
            userId,
            sieData.balanser.utgående,
            settings.slutDatum || "2025-07-29",
            "Utgående balanser",
            "SIE Import - Utgående balanser"
          );

          console.log(`📊 Slutlig räknare för ingående balanser: ${ingaendeImporterade}`);
        }

        // Sätt slutresultatet för balanser (ingående är alltid importerade om de finns)
        resultat.balanserImporterade = ingaendeImporterade;
      }

      // Steg 4: Importera resultatdata (om aktiverat)
      if (settings.inkluderaResultat) {
        if (sieData.resultat.length > 0) {
          // Om vi har verifikationer, skippa resultatdata för att undvika dubblering
          if (sieData.verifikationer.length > 0) {
            console.log(
              "⚠️ Skippar resultatdata eftersom verifikationer redan finns (undviker dubblering)"
            );
            resultat.resultatImporterat = 0;
          } else {
            // Skapa en resultatdatatransaktion bara om inga verifikationer finns
            const { rows: transaktionRows } = await client.query(
              `INSERT INTO transaktioner (
                transaktionsdatum, 
                kontobeskrivning, 
                kommentar, 
                "user_id"
              ) VALUES ($1, $2, $3, $4)
              RETURNING id`,
              [
                settings.slutDatum || "2025-07-29",
                "Resultatdata",
                "SIE Import - Resultatdata",
                userId,
              ]
            );

            const transaktionsId = transaktionRows[0].id;

            // Skapa transaktionsposter för varje resultatpost
            for (const resultatpost of sieData.resultat) {
              if (resultatpost.belopp !== 0) {
                // Hämta konto_id
                const { rows: kontoRows } = await client.query(
                  "SELECT id FROM konton WHERE kontonummer = $1",
                  [resultatpost.konto]
                );

                if (kontoRows.length === 0) {
                  console.warn(`Konto ${resultatpost.konto} hittades inte för resultatdata`);
                  continue;
                }

                const kontoId = kontoRows[0].id;
                const { debet, kredit } = convertToDebetKredit(resultatpost.belopp);

                await client.query(
                  `INSERT INTO transaktionsposter (
                    transaktions_id,
                    konto_id,
                    debet,
                    kredit
                  ) VALUES ($1, $2, $3, $4)`,
                  [transaktionsId, kontoId, debet, kredit]
                );
              }
            }
            resultat.resultatImporterat = sieData.resultat.length;
          }
        }
      }

      // Uppdatera import-logg med slutresultat
      if (importId) {
        await client.query(
          `
          UPDATE sie_importer SET
            antal_konton_skapade = $1,
            antal_verifikationer = $2,
            antal_transaktionsposter = $3,
            antal_balansposter = $4,
            antal_resultatposter = $5,
            status = 'slutförd',
            uppdaterad = NOW()
          WHERE id = $6
        `,
          [
            resultat.kontonSkapade,
            resultat.verifikationerImporterade,
            0, // Vi räknar inte transaktionsposter separat än
            resultat.balanserImporterade,
            resultat.resultatImporterat,
            importId,
          ]
        );
      }

      // Committa transaktionen
      await client.query("COMMIT");

      return {
        success: true,
        resultat,
      };
    } catch (error) {
      // Uppdatera import-logg med fel
      if (importId && client) {
        try {
          await client.query(
            `
            UPDATE sie_importer SET
              status = 'misslyckad',
              felmeddelande = $1,
              uppdaterad = NOW()
            WHERE id = $2
          `,
            [error instanceof Error ? error.message : String(error), importId]
          );
        } catch (updateError) {
          console.error("Kunde inte uppdatera import-logg:", updateError);
        }
      }

      // Rollback vid fel
      if (client) {
        try {
          await client.query("ROLLBACK");
        } catch (rollbackError) {
          console.error("Rollback fel:", rollbackError);
        }
      }
      throw error;
    } finally {
      if (client && !clientReleased) {
        client.release();
      }
    }
  } catch (error) {
    console.error("Fel vid import av SIE-data:", error);
    return {
      success: false,
      error: `Kunde inte importera SIE-data: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export async function exporteraSieData(
  år: number = 2025
): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    // 🔒 SÄKERHETSVALIDERING - Session
    const { userId } = await ensureSession();

    // 🔒 SÄKER DATABASACCESS - Hämta endast användarens företagsinfo
    const företagQuery = await pool.query(
      `SELECT email, företagsnamn, organisationsnummer FROM "user" WHERE id = $1`,
      [userId]
    );

    const företag = företagQuery.rows[0];

    // 🔒 SÄKER DATABASACCESS - Hämta alla konton (de är globala)
    const kontoQuery = await pool.query(
      `
      SELECT kontonummer, beskrivning 
      FROM konton 
      ORDER BY kontonummer::integer
    `
    );

    // Bygg SIE 4 fil-header
    let sieContent = buildSieHeader(
      företag as CompanyInfo,
      kontoQuery.rows as AccountInfo[],
      år,
      7
    );

    // 🔒 SÄKER DATABASACCESS - Hämta endast användarens egna transaktioner
    const transaktionQuery = await pool.query<{
      transaktion_id: number;
      transaktionsdatum: Date;
      kontobeskrivning: string;
      kommentar: string;
      konto_id: number;
      debet: number;
      kredit: number;
      kontonummer: string;
      kontonamn: string;
    }>(
      `SELECT 
        t.id as transaktion_id,
        t.transaktionsdatum,
        t.kontobeskrivning,
        t.kommentar,
        tp.konto_id,
        tp.debet,
        tp.kredit,
        k.kontonummer,
        k.beskrivning as kontonamn
      FROM transaktioner t
      JOIN transaktionsposter tp ON t.id = tp.transaktions_id
      JOIN konton k ON tp.konto_id = k.id
      WHERE t.user_id = $1 
      ORDER BY t.transaktionsdatum, t.id
    `,
      [userId]
    );

    // Beräkna kontosaldon per år (från -7 till 0)
    const kontoSaldonPerÅr = calculateYearlyBalances(
      transaktionQuery.rows as TransactionRow[],
      år,
      7
    );

    // Lägg till ingående balanser (#IB) för alla år
    for (let i = -6; i <= 0; i++) {
      const saldonFörÅr = kontoSaldonPerÅr.get(i - 1) || new Map(); // Föregående års saldon

      for (const konto of kontoQuery.rows) {
        if (isBalanceAccount(konto.kontonummer)) {
          // Endast balanskonton
          const saldo = saldonFörÅr.get(konto.kontonummer) || 0;
          if (Math.abs(saldo) > 0.01) {
            sieContent += `#IB ${i} ${konto.kontonummer} ${saldo.toFixed(2)}\n`;
          }
        }
      }
    }

    // Lägg till utgående balanser (#UB) för alla år
    for (let i = -7; i <= 0; i++) {
      const saldonFörÅr = kontoSaldonPerÅr.get(i)!;

      for (const [konto, saldo] of saldonFörÅr) {
        if (isBalanceAccount(konto)) {
          // Endast balanskonton
          if (Math.abs(saldo) > 0.01) {
            sieContent += `#UB ${i} ${konto} ${saldo.toFixed(2)}\n`;
          }
        }
      }
    }

    // Lägg till resultatposter (#RES) för år -1 och 0
    for (let i = -1; i <= 0; i++) {
      const saldonFörÅr = kontoSaldonPerÅr.get(i)!;

      for (const [konto, saldo] of saldonFörÅr) {
        if (!isBalanceAccount(konto)) {
          // Endast resultatkonton
          if (Math.abs(saldo) > 0.01) {
            sieContent += `#RES ${i} ${konto} ${saldo.toFixed(2)}\n`;
          }
        }
      }
    }

    // Lägg till verifikationer (#VER) för det aktuella året
    const årsTransaktioner = transaktionQuery.rows.filter((row) => {
      const transYear = new Date(row.transaktionsdatum).getFullYear();
      return transYear === år;
    });

    if (årsTransaktioner.length > 0) {
      const verifikationer = groupTransactionsByVerification(
        årsTransaktioner as TransactionRowForGrouping[]
      );

      // Skriv ut verifikationer
      for (const [, ver] of verifikationer) {
        // Kontrollera balansering
        if (!isVerificationBalanced(ver.poster)) {
          const summa = ver.poster.reduce(
            (sum: number, post: { belopp: number }) => sum + post.belopp,
            0
          );
          console.warn(`Verifikation ${ver.nummer} balanserar inte: ${summa} kr`);
          continue;
        }

        sieContent += `#VER "A" "${ver.nummer}" ${ver.datum} "${ver.beskrivning}" ${ver.datum}\n`;
        sieContent += `{\n`;

        for (const post of ver.poster) {
          sieContent += `\t#TRANS ${post.konto} {} ${post.belopp.toFixed(2)}\n`;
        }

        sieContent += `}\n`;
      }
    }

    return {
      success: true,
      data: sieContent,
    };
  } catch (error) {
    console.error("Fel vid export av SIE-data:", error);
    return {
      success: false,
      error: `Kunde inte exportera SIE-data: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// Funktion för att rensa bort dubblettkonton
export async function rensaDubblettkonton(): Promise<{
  success: boolean;
  error?: string;
  rensade?: number;
}> {
  try {
    const { userId } = await ensureSession();

    const client = await pool.connect();

    // Hitta dubbletter för användaren
    const dubletter = await findDuplicateAccounts(pool, userId);

    console.log(`🔍 Hittade ${dubletter.length} kontonummer med dubbletter`);

    let rensadeAntal = 0;

    for (const dublett of dubletter) {
      const { kontonummer, antal, ids } = dublett;
      console.log(`⚠️ Konto ${kontonummer} finns ${antal} gånger med IDs: ${ids}`);

      const rensade = await removeDuplicatesForAccount(client, kontonummer, ids, userId);
      rensadeAntal += rensade;
    }

    client.release();

    return {
      success: true,
      rensade: rensadeAntal,
    };
  } catch (error) {
    console.error("❌ Fel vid rensning av dubbletter:", error);
    return {
      success: false,
      error: "Kunde inte rensa dubbletter",
    };
  }
}

export async function kontrolleraDubbletter(): Promise<{
  success: boolean;
  harDubbletter: boolean;
  antalDubbletter?: number;
  error?: string;
}> {
  try {
    const { userId } = await ensureSession();

    // Use existing pool from top-level import
    const client = await pool.connect();

    // Hitta dubbletter för användaren
    const dublettQuery = `
      SELECT kontonummer, COUNT(*) as antal
      FROM konton 
      WHERE user_id = $1 
      GROUP BY kontonummer 
      HAVING COUNT(*) > 1
    `;

    const { rows: dubletter } = await client.query(dublettQuery, [userId]);

    client.release();

    return {
      success: true,
      harDubbletter: dubletter.length > 0,
      antalDubbletter: dubletter.length,
    };
  } catch (error) {
    console.error("❌ Fel vid kontroll av dubbletter:", error);
    return {
      success: false,
      harDubbletter: false,
      error: "Kunde inte kontrollera dubbletter",
    };
  }
}
