"use server";

import { pool } from "../../_lib/db";
import { ensureSession } from "../../_utils/session";

interface TransaktionsPost {
  kontonummer: string;
  debet: number;
  kredit: number;
}

export interface VerifikatValidation {
  transaktions_id: number;
  transaktionsdatum: string;
  kontobeskrivning: string;
  kommentar: string | null;
  belopp: number;
  varningar: string[];
  status: "ok" | "varning" | "fel";
}

export interface ValidationResult {
  success: boolean;
  totalVerifikat: number;
  verifikatMedVarningar: number;
  verifikat: VerifikatValidation[];
  error?: string;
}

/**
 * Validerar alla verifikat för en viss period och kontrollerar momsbokföring
 */
export async function validateMomsVerifikat(
  year: number,
  period: string
): Promise<ValidationResult> {
  try {
    const session = await ensureSession();
    const userId = session.userId;

    console.log("Validerar period:", { year, period, userId });

    // Beräkna datumintervall baserat på period
    let startDate: string;
    let endDate: string;

    if (period === "all") {
      startDate = `${year}-01-01`;
      endDate = `${year}-12-31`;
    } else if (period.startsWith("Q")) {
      // Kvartal
      const quarter = parseInt(period.substring(1));
      const startMonth = (quarter - 1) * 3 + 1;
      const endMonth = startMonth + 2;
      startDate = `${year}-${startMonth.toString().padStart(2, "0")}-01`;

      // Sista dagen i kvartalet
      const lastDay = new Date(year, endMonth, 0).getDate();
      endDate = `${year}-${endMonth.toString().padStart(2, "0")}-${lastDay}`;
    } else {
      // Månad
      const month = parseInt(period);
      startDate = `${year}-${month.toString().padStart(2, "0")}-01`;

      // Sista dagen i månaden
      const lastDay = new Date(year, month, 0).getDate();
      endDate = `${year}-${month.toString().padStart(2, "0")}-${lastDay}`;
    }

    console.log("Söker transaktioner mellan:", { startDate, endDate });

    // Hämta alla transaktioner för perioden
    const transactionsResult = await pool.query(
      `SELECT id as transaktions_id, transaktionsdatum, kontobeskrivning, kommentar, belopp
       FROM transaktioner
       WHERE user_id = $1
         AND transaktionsdatum >= $2
         AND transaktionsdatum <= $3
       ORDER BY transaktionsdatum ASC`,
      [userId, startDate, endDate]
    );

    const transactions = transactionsResult.rows;

    console.log("Hittade transaktioner:", transactions.length);

    if (!transactions || transactions.length === 0) {
      return {
        success: true,
        totalVerifikat: 0,
        verifikatMedVarningar: 0,
        verifikat: [],
      };
    }

    // Validera varje transaktion
    const validatedVerifikat: VerifikatValidation[] = [];

    for (const transaction of transactions) {
      // Hoppa över ingående balanser och SIE-importer
      const ignoredDescriptions = [
        "Ingående balanser",
        "SIE Import",
        "IB ",
        "Ingående saldo",
        "Årets ingående balans",
      ];

      const shouldIgnore = ignoredDescriptions.some((desc) =>
        transaction.kontobeskrivning?.toLowerCase().includes(desc.toLowerCase())
      );

      if (shouldIgnore) {
        // Lägg till men markera som OK
        validatedVerifikat.push({
          transaktions_id: transaction.transaktions_id,
          transaktionsdatum: transaction.transaktionsdatum,
          kontobeskrivning: transaction.kontobeskrivning,
          kommentar: transaction.kommentar,
          belopp: transaction.belopp,
          varningar: [],
          status: "ok",
        });
        continue;
      }

      const varningar: string[] = [];

      // Hämta alla transaktionsposter för detta verifikat
      const posterResult = await pool.query<TransaktionsPost>(
        `SELECT k.kontonummer, tp.debet, tp.kredit
         FROM transaktionsposter tp
         JOIN konton k ON tp.konto_id = k.id
         WHERE tp.transaktions_id = $1`,
        [transaction.transaktions_id]
      );

      const poster = posterResult.rows;

      if (!poster || poster.length === 0) {
        varningar.push("Kunde inte hämta transaktionsposter");
      } else {
        // 1. Kontrollera att verifikatet är balanserat
        const totalDebet = poster.reduce(
          (sum: number, p: TransaktionsPost) => sum + (p.debet || 0),
          0
        );
        const totalKredit = poster.reduce(
          (sum: number, p: TransaktionsPost) => sum + (p.kredit || 0),
          0
        );
        const skillnad = Math.abs(totalDebet - totalKredit);

        if (skillnad > 0.01) {
          varningar.push(`Verifikatet är inte balanserat (skillnad: ${skillnad.toFixed(2)} kr)`);
        }

        // 2. Kontrollera momsbokföring
        const harMomskonto = poster.some((p: TransaktionsPost) => {
          const konto = parseInt(p.kontonummer);
          return (
            (konto >= 2610 && konto <= 2650) || // Utgående moms
            (konto >= 2640 && konto <= 2650) || // Ingående moms
            konto === 2514 || // Skatteskulder
            konto === 2518 || // Skattefordringar
            konto === 2641 || // Debiterad ingående moms
            konto === 2645 // Beräknad ingående moms
          );
        });

        const harIntäktskonto = poster.some((p: TransaktionsPost) => {
          const konto = parseInt(p.kontonummer);
          return konto >= 3000 && konto <= 3999; // Intäkter
        });

        const harKostnadskonto = poster.some((p: TransaktionsPost) => {
          const konto = parseInt(p.kontonummer);
          return (
            (konto >= 4000 && konto <= 7999) || // Kostnader
            (konto >= 2400 && konto <= 2499) // Leverantörsskulder (inköp)
          );
        });

        // Varning om försäljning utan moms (utom för vissa konton)
        if (harIntäktskonto && !harMomskonto) {
          const harUndantagskonto = poster.some((p: TransaktionsPost) => {
            const konto = parseInt(p.kontonummer);
            return (
              konto === 3740 || // Öres- och kronutjämning
              konto === 3960 || // Valutakursvinster
              konto === 3740 // Kassadifferenser
            );
          });

          if (!harUndantagskonto) {
            varningar.push("Intäkt utan utgående moms - kontrollera att detta är korrekt");
          }
        }

        // Varning om inköp utan moms (utom för vissa typer)
        if (harKostnadskonto && !harMomskonto && transaction.belopp > 200) {
          const harLönekonto = poster.some((p: TransaktionsPost) => {
            const konto = parseInt(p.kontonummer);
            return konto >= 7000 && konto <= 7699; // Lönekostnader
          });

          const harFinanskonto = poster.some((p: TransaktionsPost) => {
            const konto = parseInt(p.kontonummer);
            return konto >= 8000 && konto <= 8999; // Finansiella kostnader
          });

          if (!harLönekonto && !harFinanskonto) {
            varningar.push("Kostnad utan ingående moms - kontrollera att detta är korrekt");
          }
        }

        // 3. Kontrollera momsbelopp (om momskonto finns)
        if (harMomskonto) {
          const momspost = poster.find((p: TransaktionsPost) => {
            const konto = parseInt(p.kontonummer);
            return konto >= 2610 && konto <= 2650;
          });

          if (momspost) {
            const momsbelopp = momspost.debet || momspost.kredit || 0;

            // Hitta försäljnings- eller kostnadskontot för att få nettosumman
            const nettopost = poster.find((p: TransaktionsPost) => {
              const konto = parseInt(p.kontonummer);
              return (
                (konto >= 3000 && konto <= 3999) || // Intäkter
                (konto >= 4000 && konto <= 7999)
              ); // Kostnader
            });

            if (nettopost && momsbelopp > 0) {
              const nettobelopp = nettopost.debet || nettopost.kredit || 0;

              // Beräkna förväntad moms baserat på nettobeloppet
              const förväntadMoms25 = nettobelopp * 0.25;
              const förväntadMoms12 = nettobelopp * 0.12;
              const förväntadMoms6 = nettobelopp * 0.06;

              const avvikelse25 = Math.abs(momsbelopp - förväntadMoms25);
              const avvikelse12 = Math.abs(momsbelopp - förväntadMoms12);
              const avvikelse6 = Math.abs(momsbelopp - förväntadMoms6);

              const minstaAvvikelse = Math.min(avvikelse25, avvikelse12, avvikelse6);

              // Varning om momsbeloppet avviker mer än 1 kr från någon momssats
              if (minstaAvvikelse > 1) {
                varningar.push(
                  `Momsbeloppet (${momsbelopp.toFixed(2)} kr) verkar inte stämma med standardmomssatser (netto: ${nettobelopp.toFixed(2)} kr)`
                );
              }
            }
          }
        }
      }

      validatedVerifikat.push({
        transaktions_id: transaction.transaktions_id,
        transaktionsdatum: transaction.transaktionsdatum,
        kontobeskrivning: transaction.kontobeskrivning,
        kommentar: transaction.kommentar,
        belopp: transaction.belopp,
        varningar,
        status:
          varningar.length === 0
            ? "ok"
            : varningar.some((v) => v.includes("balanserat"))
              ? "fel"
              : "varning",
      });
    }

    const verifikatMedVarningar = validatedVerifikat.filter((v) => v.status !== "ok").length;

    return {
      success: true,
      totalVerifikat: validatedVerifikat.length,
      verifikatMedVarningar,
      verifikat: validatedVerifikat,
    };
  } catch (error) {
    console.error("Fel vid validering av momsverifikat:", error);
    return {
      success: false,
      totalVerifikat: 0,
      verifikatMedVarningar: 0,
      verifikat: [],
      error: error instanceof Error ? error.message : "Okänt fel",
    };
  }
}
