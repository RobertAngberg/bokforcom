"use server";

import { Pool } from "pg";
import { auth } from "../auth";
import { getSessionAndUserId } from "../_utils/authUtils";
import { signupRateLimit } from "../_utils/rateLimit";
import { sanitizeFormInput } from "../_utils/validationUtils";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { validateEmail, validatePassword } from "./sakerhet/loginValidation";
import { Resend } from "resend";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const resend = new Resend(process.env.RESEND_API_KEY);

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
        [userId.toString(), eventType, details, ip || null]
      );
    } else {
      console.log(`Signup Security Event [${eventType}] User: ${userId} IP: ${ip} - ${details}`);
    }
  } catch (error) {
    console.error("Failed to log signup security event:", error);
    console.log(`Signup Security Event [${eventType}] User: ${userId} IP: ${ip} - ${details}`);
  }
}

function getClientIP(headers?: Record<string, string>): string | undefined {
  if (!headers) return undefined;

  // Kolla vanliga IP-headers i ordning
  return (
    headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    headers["x-real-ip"] ||
    headers["cf-connecting-ip"] ||
    headers["x-client-ip"] ||
    headers["x-forwarded"] ||
    headers["forwarded"] ||
    undefined
  );
}

// Skicka verification email
async function sendVerificationEmail(email: string, token: string, name: string): Promise<boolean> {
  const verificationUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/auth/verify-email?token=${token}`;

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "noreply@localhost",
      to: email,
      subject: "Verifiera din email-adress",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Hej ${name}!</h2>
          <p>Tack för att du registrerat dig på vår plattform.</p>
          <p>Klicka på länken nedan för att verifiera din email-adress:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background: #0070f3; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;
                      font-weight: bold;">
              Verifiera Email
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            Om du inte kan klicka på knappen, kopiera denna länk:
            <br>
            <code style="background: #f5f5f5; padding: 2px 4px; border-radius: 3px;">${verificationUrl}</code>
          </p>
          
          <p style="color: #666; font-size: 14px;">
            Denna länk är giltig i 24 timmar.
          </p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px;">
            Om du inte registrerat dig kan du ignorera detta mail.
          </p>
        </div>
      `,
    });

    console.log(`✅ Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Failed to send verification email:", error);
    return false;
  }
}

// Server action för initial signup (email/password/name)
export async function createAccount(formData: FormData) {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;

    // Validera input
    if (!email || !password || !name) {
      return { success: false, error: "Alla fält krävs" };
    }

    // Validera email
    if (!validateEmail(email)) {
      return { success: false, error: "Ogiltig e-postadress" };
    }

    // Validera lösenord
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return {
        success: false,
        error: passwordValidation.errors.join(", "),
      };
    }

    // Validera namn
    if (name.trim().length < 2 || name.trim().length > 100) {
      return { success: false, error: "Namnet måste vara mellan 2-100 tecken" };
    }

    // Kolla om email redan finns
    const existingUser = await pool.query("SELECT email FROM users WHERE email = $1", [email]);

    if (existingUser.rows.length > 0) {
      return {
        success: false,
        error: "En användare med denna e-postadress finns redan",
      };
    }

    // Hasha lösenord
    const hashedPassword = await bcrypt.hash(password, 12);

    // Skapa verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 timmar

    // Lägg till användare i databasen
    const result = await pool.query(
      `INSERT INTO users (email, password, name, email_verified, verification_token, verification_expires, created_at) 
       VALUES ($1, $2, $3, false, $4, $5, NOW()) 
       RETURNING id, email, name`,
      [email, hashedPassword, name.trim(), verificationToken, verificationExpires]
    );

    const newUser = result.rows[0];

    // Skicka verifieringsmail
    const emailSent = await sendVerificationEmail(email, verificationToken, name.trim());

    if (!emailSent) {
      // Om mejlet inte kunde skickas, ta bort användaren från databasen
      await pool.query("DELETE FROM users WHERE id = $1", [newUser.id]);
      return {
        success: false,
        error: "Kunde inte skicka verifieringsmail. Försök igen senare.",
      };
    }

    return {
      success: true,
      message: "Konto skapat! Kontrollera din e-post för verifiering.",
      user: newUser,
    };
  } catch (error) {
    console.error("Signup error:", error);
    return {
      success: false,
      error: "Något gick fel vid registrering. Försök igen.",
    };
  }
}

export async function checkUserSignupStatus() {
  try {
    // 🔒 SÄKERHETSVALIDERING - Session (optional för signup) - använd auth() direkt utan redirect
    const session = await auth();
    if (!session?.user?.email || !session?.user?.id) {
      // Returnera att användaren inte är inloggad - det är OK för signup-sidan
      return { loggedIn: false, hasSignedUp: false };
    }

    const userId = parseInt(session.user.id, 10);
    const userEmail = session.user.email;

    // Rate limiting för status-kontroller - använd enkel session limiting
    if (!signupRateLimit(userId.toString())) {
      await logSignupSecurityEvent(
        userId.toString(),
        "rate_limit_exceeded",
        "Rate limit exceeded for signup status check",
        undefined
      );
      return {
        loggedIn: true,
        hasCompanyInfo: false,
        error: "För många försök - vänta 15 minuter",
      };
    }

    await logSignupSecurityEvent(
      userId.toString(),
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
          userId.toString(),
          "signup_status_user_not_found",
          `User not found in database: ${userEmail}`
        );
        return { loggedIn: true, hasCompanyInfo: false };
      }

      const user = result.rows[0];
      const hasCompanyInfo = !!(user.företagsnamn || user.organisationsnummer);

      await logSignupSecurityEvent(
        userId.toString(),
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
      const { session: errorSession, userId: errorUserId } = await getSessionAndUserId();
      if (errorSession?.user?.email && errorUserId) {
        await logSignupSecurityEvent(
          errorUserId.toString(),
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
    const { session, userId } = await getSessionAndUserId();
    if (!session?.user?.email || !userId) {
      return { success: false, error: "Ingen användare inloggad" };
    }

    const userEmail = session.user.email;
    const clientIP = getClientIP();

    // Dubbel rate limiting för signup-operationer (session + IP)
    if (!signupRateLimit(userId.toString(), clientIP)) {
      await logSignupSecurityEvent(
        userId.toString(),
        "rate_limit_exceeded",
        "Rate limit exceeded for signup data save",
        clientIP
      );
      return { success: false, error: "För många försök - vänta 15 minuter" };
    }

    await logSignupSecurityEvent(
      userId.toString(),
      "signup_save_attempt",
      `Signup data save started for user: ${userEmail}`,
      clientIP
    );

    // 🔒 INPUT-SANITERING (grundläggande säkerhet - frontend redan validerat)
    const rawOrganisationsnummer = formData.get("organisationsnummer")?.toString() || "";
    const rawFöretagsnamn = formData.get("företagsnamn")?.toString() || "";
    const rawMomsperiod = formData.get("momsperiod")?.toString() || "";
    const rawBokföringsmetod = formData.get("redovisningsmetod")?.toString() || "";
    const rawFörsta_bokslut = formData.get("första_bokslut")?.toString() || "";
    const rawStartdatum = formData.get("startdatum")?.toString() || "";
    const rawSlutdatum = formData.get("slutdatum")?.toString() || "";

    // Grundläggande säkerhetskontroller (frontend validation redan gjord)
    if (!rawOrganisationsnummer || !rawFöretagsnamn) {
      await logSignupSecurityEvent(
        userId.toString(),
        "signup_validation_failed",
        "Missing required fields",
        clientIP
      );
      return { success: false, error: "Saknade obligatoriska fält" };
    }

    // Sanitera all input
    const organisationsnummer = sanitizeFormInput(rawOrganisationsnummer);
    const företagsnamn = sanitizeFormInput(rawFöretagsnamn);
    const momsperiod = sanitizeFormInput(rawMomsperiod);
    const bokföringsmetod = sanitizeFormInput(rawBokföringsmetod);
    const första_bokslut = sanitizeFormInput(rawFörsta_bokslut);
    const startdatum = rawStartdatum ? sanitizeFormInput(rawStartdatum) : null;
    const slutdatum = rawSlutdatum ? sanitizeFormInput(rawSlutdatum) : null;

    // Säkerhetskontroller för tillåtna värden (även om frontend validerat)
    const allowedMomsperiods = ["månadsvis", "kvartalsvis", "årsvis"];
    const allowedMethods = ["kassaredovisning", "fakturaredovisning"];

    if (momsperiod && !allowedMomsperiods.includes(momsperiod)) {
      await logSignupSecurityEvent(
        userId.toString(),
        "signup_security_violation",
        `Invalid momsperiod: ${momsperiod}`,
        clientIP
      );
      return { success: false, error: "Säkerhetsfel - ogiltig data" };
    }

    if (bokföringsmetod && !allowedMethods.includes(bokföringsmetod)) {
      await logSignupSecurityEvent(
        userId.toString(),
        "signup_security_violation",
        `Invalid bokföringsmetod: ${bokföringsmetod}`,
        clientIP
      );
      return { success: false, error: "Säkerhetsfel - ogiltig data" };
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
          userId.toString(),
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
          userId.toString(),
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
        userId.toString(),
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
          userId.toString(),
        ]
      );

      if (result.rows.length === 0) {
        await logSignupSecurityEvent(
          userId.toString(),
          "signup_update_failed",
          `Failed to update user: ${userEmail}`,
          clientIP
        );
        return { success: false, error: "Kunde inte uppdatera användarinformation" };
      }

      await logSignupSecurityEvent(
        userId.toString(),
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
      const { session: errorSession, userId: errorUserId } = await getSessionAndUserId();
      if (errorSession?.user?.email && errorUserId) {
        await logSignupSecurityEvent(
          errorUserId.toString(),
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
