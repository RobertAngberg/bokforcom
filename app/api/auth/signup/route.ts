import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Pool } from "@neondatabase/serverless";
import { Resend } from "resend";
import crypto from "crypto";
import { authRateLimit, getClientIP } from "../../../_utils/rateLimit";

const resend = new Resend(process.env.RESEND_API_KEY);

// Generera säker verification token
function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Skicka verification email
async function sendVerificationEmail(email: string, token: string, name: string) {
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

// Säkerhetsloggning för signup-försök
function logSecurityEvent(
  event: "signup_attempt" | "signup_success" | "signup_failure",
  email?: string,
  reason?: string,
  ip?: string
) {
  const timestamp = new Date().toISOString();
  console.warn(`🔒 SECURITY EVENT [${event.toUpperCase()}]`, {
    email: email ? email.replace(/@.*/, "@***") : undefined, // Maskera domän för privacy
    reason,
    ip,
    timestamp,
  });
}

// Funktion för förbättrad lösenordsvalidering
function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Lösenordet måste vara minst 8 tecken");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Lösenordet måste innehålla minst en stor bokstav");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Lösenordet måste innehålla minst en liten bokstav");
  }

  if (!/\d/.test(password)) {
    errors.push("Lösenordet måste innehålla minst en siffra");
  }

  // Kontrollera vanliga svaga lösenord
  const commonPasswords = [
    "password",
    "123456",
    "password123",
    "admin",
    "qwerty",
    "letmein",
    "welcome",
    "monkey",
    "dragon",
    "password1",
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push("Lösenordet är för vanligt och osäkert");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Funktion för email-validering
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

// Funktion för namn-validering
function validateName(name: string): boolean {
  return name.trim().length >= 2 && name.trim().length <= 100;
}

// Hjälpfunktion för att hämta IP-adress
function getClientIp(request: NextRequest): string {
  // Försök olika headers för IP-adress
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  return "unknown";
}

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);

  try {
    // Rate limiting kontroll - använd centraliserat system
    const rateLimitResult = authRateLimit(ip);
    if (!rateLimitResult.allowed) {
      logSecurityEvent("signup_failure", undefined, "Rate limit exceeded", ip);
      return NextResponse.json(
        {
          error: "För många registreringsförsök. Försök igen om 15 minuter.",
        },
        { status: 429 }
      );
    }

    const { email, password, name } = await request.json();

    logSecurityEvent("signup_attempt", email, undefined, ip);

    // Grundläggande validering
    if (!email || !password || !name) {
      logSecurityEvent("signup_failure", email, "Missing required fields", ip);
      return NextResponse.json({ error: "Alla fält krävs" }, { status: 400 });
    }

    // Email-validering
    if (!validateEmail(email)) {
      logSecurityEvent("signup_failure", email, "Invalid email format", ip);
      return NextResponse.json(
        {
          error: "Ogiltig email-adress",
        },
        { status: 400 }
      );
    }

    // Namn-validering
    if (!validateName(name)) {
      logSecurityEvent("signup_failure", email, "Invalid name format", ip);
      return NextResponse.json(
        {
          error: "Namnet måste vara mellan 2-100 tecken",
        },
        { status: 400 }
      );
    }

    // Förbättrad lösenordsvalidering
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      logSecurityEvent("signup_failure", email, "Weak password", ip);
      return NextResponse.json(
        {
          error: "Lösenordet uppfyller inte säkerhetskraven",
          details: passwordValidation.errors,
        },
        { status: 400 }
      );
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    // Kolla om användaren redan finns
    const existingUser = await pool.query("SELECT id, email_verified FROM users WHERE email = $1", [
      email,
    ]);

    if (existingUser.rows.length > 0) {
      const user = existingUser.rows[0];

      if (user.email_verified) {
        // Email redan verifierad och registrerad
        logSecurityEvent("signup_failure", email, "Email already exists and verified", ip);
        return NextResponse.json(
          { error: "En användare med denna email är redan registrerad." },
          { status: 400 }
        );
      } else {
        // Email finns men inte verifierad - skicka nytt verifieringsmail
        const newToken = generateVerificationToken();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

        await pool.query(
          "UPDATE users SET verification_token = $1, verification_expires = $2 WHERE email = $3",
          [newToken, expiresAt, email]
        );

        const emailSent = await sendVerificationEmail(email, newToken, name);

        if (!emailSent) {
          return NextResponse.json(
            { error: "Kunde inte skicka verifieringsmail. Försök igen senare." },
            { status: 500 }
          );
        }

        logSecurityEvent("signup_success", email, "Resent verification email", ip);

        return NextResponse.json(
          {
            message: "Verifieringsmail skickat. Kontrollera din email.",
            requiresVerification: true,
          },
          { status: 200 }
        );
      }
    }

    // Generera verification token
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 timmar

    // Hasha lösenordet
    const hashedPassword = await bcrypt.hash(password, 12);

    // Skapa användaren MEN märk som OVERIFIERAD
    const result = await pool.query(
      `INSERT INTO users (email, name, password, email_verified, verification_token, verification_expires, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
       RETURNING id, email, name`,
      [email, name.trim(), hashedPassword, false, verificationToken, verificationExpires]
    );

    const user = result.rows[0];

    // Skicka verifieringsmail
    const emailSent = await sendVerificationEmail(email, verificationToken, name);

    if (!emailSent) {
      // Om email-sending misslyckas, ta bort användaren från databasen
      await pool.query("DELETE FROM users WHERE id = $1", [user.id]);
      return NextResponse.json(
        { error: "Kunde inte skicka verifieringsmail. Försök igen senare." },
        { status: 500 }
      );
    }

    logSecurityEvent("signup_success", email, "Account created, pending verification", ip);

    return NextResponse.json(
      {
        message: "Konto skapat! Kontrollera din email för att verifiera kontot.",
        user: { id: user.id, email: user.email, name: user.name },
        requiresVerification: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    logSecurityEvent("signup_failure", undefined, "Server error", ip);

    // Dölj känsliga fel-detaljer från klienten
    return NextResponse.json(
      {
        error: "Ett oväntat fel inträffade. Försök igen senare.",
      },
      { status: 500 }
    );
  }
}
