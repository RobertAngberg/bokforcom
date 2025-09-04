import { NextRequest, NextResponse } from "next/server";
import { Pool } from "@neondatabase/serverless";
import { Resend } from "resend";
import crypto from "crypto";

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

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email krävs" }, { status: 400 });
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    // Hitta användare som inte är verifierad
    const userResult = await pool.query(
      "SELECT id, name, email FROM users WHERE email = $1 AND email_verified = FALSE",
      [email]
    );

    if (userResult.rows.length === 0) {
      // Säkerhetsåtgärd: säg inte om email existerar eller redan är verifierad
      return NextResponse.json(
        { message: "Om email:en existerar och inte är verifierad skickas ett nytt mail." },
        { status: 200 }
      );
    }

    const user = userResult.rows[0];

    // Generera nytt token
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 timmar

    // Uppdatera token i databasen
    await pool.query(
      "UPDATE users SET verification_token = $1, verification_expires = $2 WHERE id = $3",
      [verificationToken, verificationExpires, user.id]
    );

    // Skicka email
    const emailSent = await sendVerificationEmail(email, verificationToken, user.name);

    if (!emailSent) {
      return NextResponse.json(
        { error: "Kunde inte skicka verifieringsmail. Försök igen senare." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Nytt verifieringsmail skickat. Kontrollera din inbox.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json({ error: "Serverfel" }, { status: 500 });
  }
}
