"use server";

import { auth } from "../../auth";
import { Pool } from "pg";
import crypto from "crypto";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// 🔒 ENTERPRISE SÄKERHETSFUNKTIONER FÖR SIGNUP-MODUL
const sessionAttempts = new Map<string, { attempts: number; lastAttempt: number }>();
const ipAttempts = new Map<string, { attempts: number; lastAttempt: number }>();

async function validateSessionAttempt(sessionId: string, ip?: string): Promise<boolean> {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minuter
  const maxAttemptsPerSession = 3; // Max 3 signup-försök per session
  const maxAttemptsPerIP = 10; // Max 10 signup-försök per IP

  // Kontrollera session-baserad rate limiting
  const userAttempts = sessionAttempts.get(sessionId) || { attempts: 0, lastAttempt: 0 };
  if (now - userAttempts.lastAttempt > windowMs) {
    userAttempts.attempts = 0;
  }

  if (userAttempts.attempts >= maxAttemptsPerSession) {
    await logSignupSecurityEvent(
      sessionId,
      "rate_limit_session_exceeded",
      `Session rate limit exceeded: ${userAttempts.attempts} attempts`,
      ip
    );
    return false;
  }

  // Kontrollera IP-baserad rate limiting
  if (ip) {
    const ipUserAttempts = ipAttempts.get(ip) || { attempts: 0, lastAttempt: 0 };
    if (now - ipUserAttempts.lastAttempt > windowMs) {
      ipUserAttempts.attempts = 0;
    }

    if (ipUserAttempts.attempts >= maxAttemptsPerIP) {
      await logSignupSecurityEvent(
        sessionId,
        "rate_limit_ip_exceeded",
        `IP rate limit exceeded: ${ipUserAttempts.attempts} attempts`,
        ip
      );
      return false;
    }

    ipUserAttempts.attempts++;
    ipUserAttempts.lastAttempt = now;
    ipAttempts.set(ip, ipUserAttempts);
  }

  userAttempts.attempts++;
  userAttempts.lastAttempt = now;
  sessionAttempts.set(sessionId, userAttempts);

  return true;
}

async function logSignupSecurityEvent(
  userId: string,
  eventType: string,
  details: string,
  ip?: string
): Promise<void> {
  try {
    // Kontrollera om security_logs tabellen finns
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'security_logs'
      );
    `);

    if (tableExists.rows[0].exists) {
      await pool.query(
        `INSERT INTO security_logs (user_id, event_type, details, timestamp, module, ip_address) 
         VALUES ($1, $2, $3, NOW(), 'SIGNUP', $4)`,
        [userId, eventType, details, ip || null]
      );
    } else {
      console.log(`Signup Security Event [${eventType}] User: ${userId} IP: ${ip} - ${details}`);
    }
  } catch (error) {
    console.error("Failed to log signup security event:", error);
    console.log(`Signup Security Event [${eventType}] User: ${userId} IP: ${ip} - ${details}`);
  }
}

function validateOrganisationsnummer(orgnr: string): { valid: boolean; error?: string } {
  if (!orgnr) return { valid: false, error: "Organisationsnummer krävs" };

  // Ta bort alla icke-siffror
  const cleanOrgNr = orgnr.replace(/\D/g, "");

  // Kontrollera längd (10 siffror för organisationsnummer, 12 för personnummer)
  if (cleanOrgNr.length !== 10 && cleanOrgNr.length !== 12) {
    return { valid: false, error: "Organisationsnummer måste vara 10 siffror (YYYYMMDDXX)" };
  }

  // För personnummer (12 siffror), ta bara de sista 10
  const orgNrToValidate = cleanOrgNr.length === 12 ? cleanOrgNr.slice(2) : cleanOrgNr;

  // Grundläggande format-kontroll
  if (!/^\d{10}$/.test(orgNrToValidate)) {
    return { valid: false, error: "Organisationsnummer har ogiltigt format" };
  }

  return { valid: true };
}

function validateCompanyName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: "Företagsnamn krävs" };
  }

  if (name.trim().length < 2) {
    return { valid: false, error: "Företagsnamn måste vara minst 2 tecken" };
  }

  if (name.trim().length > 100) {
    return { valid: false, error: "Företagsnamn får vara max 100 tecken" };
  }

  // Kontrollera för misstänkta mönster
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /onload=/i,
    /onerror=/i,
    /DROP\s+TABLE/i,
    /DELETE\s+FROM/i,
    /INSERT\s+INTO/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(name)) {
      return { valid: false, error: "Företagsnamn innehåller otillåtna tecken" };
    }
  }

  return { valid: true };
}

function sanitizeInput(input: string): string {
  return input
    .replace(/[<>'"&]/g, "")
    .trim()
    .substring(0, 200); // Begränsa längd
}

function getClientIP(headers?: Record<string, string>): string | undefined {
  // I en riktig miljö skulle detta komma från request headers
  return "unknown-ip";
}

export async function checkUserSignupStatus() {
  try {
    // 🔒 SÄKERHETSVALIDERING - Session
    const session = await auth();
    if (!session?.user?.email || !session?.user?.id) {
      return { loggedIn: false };
    }

    const userId = session.user.id;
    const userEmail = session.user.email;

    // Rate limiting för status-kontroller
    if (!(await validateSessionAttempt(userId))) {
      return {
        loggedIn: true,
        hasCompanyInfo: false,
        error: "För många försök - vänta 15 minuter",
      };
    }

    await logSignupSecurityEvent(
      userId,
      "signup_status_check",
      `Status check for user: ${userEmail}`
    );

    const client = await pool.connect();
    try {
      // 🔒 SÄKER DATABASACCESS - Använd userId istället för email
      const result = await client.query(
        `SELECT företagsnamn, organisationsnummer FROM users WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        await logSignupSecurityEvent(
          userId,
          "signup_status_user_not_found",
          `User not found in database: ${userEmail}`
        );
        return { loggedIn: true, hasCompanyInfo: false };
      }

      const user = result.rows[0];
      const hasCompanyInfo = !!(user.företagsnamn || user.organisationsnummer);

      await logSignupSecurityEvent(
        userId,
        "signup_status_success",
        `Status retrieved successfully: hasCompanyInfo=${hasCompanyInfo}`
      );

      return {
        loggedIn: true,
        hasCompanyInfo,
        companyName: user.företagsnamn,
      };
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Fel vid kontroll av använderstatus:", error);
    // Försök logga fel om vi har session
    try {
      const errorSession = await auth();
      if (errorSession?.user?.id) {
        await logSignupSecurityEvent(
          errorSession.user.id,
          "signup_status_error",
          `Error checking status: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }
    return { loggedIn: true, hasCompanyInfo: false, error: true };
  }
}

export async function saveSignupData(formData: FormData) {
  try {
    // 🔒 SÄKERHETSVALIDERING - Session & Rate Limiting
    const session = await auth();
    if (!session?.user?.email || !session?.user?.id) {
      return { success: false, error: "Ingen användare inloggad" };
    }

    const userId = session.user.id;
    const userEmail = session.user.email;
    const clientIP = getClientIP();

    // Dubbel rate limiting för signup-operationer
    if (!(await validateSessionAttempt(userId, clientIP))) {
      return { success: false, error: "För många försök - vänta 15 minuter" };
    }

    await logSignupSecurityEvent(
      userId,
      "signup_save_attempt",
      `Signup data save started for user: ${userEmail}`,
      clientIP
    );

    // 🔒 INPUT-VALIDERING OCH SANITERING
    const rawOrganisationsnummer = formData.get("organisationsnummer")?.toString() || "";
    const rawFöretagsnamn = formData.get("företagsnamn")?.toString() || "";
    const rawMomsperiod = formData.get("momsperiod")?.toString() || "";
    const rawBokföringsmetod = formData.get("redovisningsmetod")?.toString() || "";
    const rawFörsta_bokslut = formData.get("första_bokslut")?.toString() || "";
    const rawStartdatum = formData.get("startdatum")?.toString() || "";
    const rawSlutdatum = formData.get("slutdatum")?.toString() || "";

    // Validera organisationsnummer
    const orgValidation = validateOrganisationsnummer(rawOrganisationsnummer);
    if (!orgValidation.valid) {
      await logSignupSecurityEvent(
        userId,
        "signup_validation_failed",
        `Invalid organisationsnummer: ${orgValidation.error}`,
        clientIP
      );
      return { success: false, error: orgValidation.error };
    }

    // Validera företagsnamn
    const nameValidation = validateCompanyName(rawFöretagsnamn);
    if (!nameValidation.valid) {
      await logSignupSecurityEvent(
        userId,
        "signup_validation_failed",
        `Invalid company name: ${nameValidation.error}`,
        clientIP
      );
      return { success: false, error: nameValidation.error };
    }

    // Sanitera all input
    const organisationsnummer = sanitizeInput(rawOrganisationsnummer);
    const företagsnamn = sanitizeInput(rawFöretagsnamn);
    const momsperiod = sanitizeInput(rawMomsperiod);
    const bokföringsmetod = sanitizeInput(rawBokföringsmetod);
    const första_bokslut = sanitizeInput(rawFörsta_bokslut);
    const startdatum = rawStartdatum ? sanitizeInput(rawStartdatum) : null;
    const slutdatum = rawSlutdatum ? sanitizeInput(rawSlutdatum) : null;

    // Validera att momsperiod är tillåten
    const allowedMomsperiods = ["månadsvis", "kvartalsvis", "årsvis"];
    if (momsperiod && !allowedMomsperiods.includes(momsperiod)) {
      await logSignupSecurityEvent(
        userId,
        "signup_validation_failed",
        `Invalid momsperiod: ${momsperiod}`,
        clientIP
      );
      return { success: false, error: "Ogiltig momsperiod" };
    }

    // Validera att bokföringsmetod är tillåten
    const allowedMethods = ["kassaredovisning", "fakturaredovisning"];
    if (bokföringsmetod && !allowedMethods.includes(bokföringsmetod)) {
      await logSignupSecurityEvent(
        userId,
        "signup_validation_failed",
        `Invalid bokföringsmetod: ${bokföringsmetod}`,
        clientIP
      );
      return { success: false, error: "Ogiltig bokföringsmetod" };
    }

    const client = await pool.connect();
    try {
      // 🔒 SÄKER DATABASACCESS - Kontrollera befintlig användare
      const existingUser = await client.query(
        `SELECT id, företagsnamn, organisationsnummer FROM users WHERE id = $1`,
        [userId]
      );

      if (existingUser.rows.length === 0) {
        await logSignupSecurityEvent(
          userId,
          "signup_user_not_found",
          `User not found in database: ${userEmail}`,
          clientIP
        );
        return { success: false, error: "Användare hittades inte" };
      }

      const user = existingUser.rows[0];

      // Kontrollera om användaren redan har företagsinformation
      if (user.företagsnamn || user.organisationsnummer) {
        await logSignupSecurityEvent(
          userId,
          "signup_duplicate_attempt",
          `User already has company info: ${userEmail}`,
          clientIP
        );
        return {
          success: false,
          error: "Företagsinformation finns redan registrerad för detta konto",
        };
      }

      await logSignupSecurityEvent(
        userId,
        "signup_save_processing",
        `Saving signup data for user: ${userEmail}`,
        clientIP
      );

      // 🔒 SÄKER DATABASUPPDATERING
      const result = await client.query(
        `UPDATE users 
         SET organisationsnummer = $1, 
             företagsnamn = $2, 
             momsperiod = $3, 
             bokföringsmetod = $4, 
             första_bokslut = $5, 
             startdatum = $6, 
             slutdatum = $7,
             uppdaterad = NOW()
         WHERE id = $8 AND företagsnamn IS NULL AND organisationsnummer IS NULL
         RETURNING id, name, email, företagsnamn`,
        [
          organisationsnummer,
          företagsnamn,
          momsperiod,
          bokföringsmetod,
          första_bokslut,
          startdatum,
          slutdatum,
          userId,
        ]
      );

      if (result.rows.length === 0) {
        await logSignupSecurityEvent(
          userId,
          "signup_update_failed",
          `Failed to update user: ${userEmail}`,
          clientIP
        );
        return { success: false, error: "Kunde inte uppdatera användarinformation" };
      }

      await logSignupSecurityEvent(
        userId,
        "signup_save_success",
        `Signup data saved successfully for user: ${userEmail}`,
        clientIP
      );

      return {
        success: true,
        message: "Företagsinformation sparad!",
        user: result.rows[0],
      };
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ Fel vid sparande av signup-data:", error);
    // Logga fel om vi har session
    try {
      const errorSession = await auth();
      if (errorSession?.user?.id) {
        await logSignupSecurityEvent(
          errorSession.user.id,
          "signup_save_error",
          `Error saving signup data: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }
    return {
      success: false,
      error: "Kunde inte spara företagsinformation",
    };
  }
}
