import { NextResponse } from "next/server";
import { Resend } from "resend";
import EmailTemplate from "./EmailTemplate";
import { emailRateLimit, createRateLimitIdentifier } from "../../_utils/rateLimit";

const DEV_EMAIL = "info@xn--bokfr-mua.com";

// Säker email-validering
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// Säker text-sanitization för HTML-innehåll
function sanitizeText(text: string): string {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(/[<>'"&]/g, "") // Ta bort farliga tecken
    .trim()
    .substring(0, 500); // Begränsa längd
}

// Validera filename för säkerhet
function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== "string") return "faktura.pdf";
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "") // Bara säkra tecken
    .substring(0, 50) // Begränsa längd
    .toLowerCase();
}

export async function POST(request: Request) {
  try {
    // SÄKERHETSVALIDERING: Rate limiting för email-skickning
    const identifier = createRateLimitIdentifier(request);
    const rateLimitResult = emailRateLimit(identifier);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: "För många email-försök. Du kan skicka max 10 emails per timme.",
          resetTime: rateLimitResult.resetTime,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": "10",
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
          },
        }
      );
    }

    if (!process.env.AUTH_RESEND_KEY) {
      console.error("AUTH_RESEND_KEY is missing");
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 });
    }

    const resend = new Resend(process.env.AUTH_RESEND_KEY);

    const body = await request.json();
    const { faktura, pdfAttachment, filename: rawFilename, customMessage: rawCustomMessage } = body;

    // Säker sanitization av inputs
    const customMessage = sanitizeText(rawCustomMessage);
    const filename = sanitizeFilename(rawFilename) || "faktura.pdf";

    // Validera faktura-objekt
    if (!faktura || typeof faktura !== "object") {
      return NextResponse.json({ error: "Ogiltig faktura-data" }, { status: 400 });
    }

    const firstName = sanitizeText(faktura.kundnamn?.split(" ")[0]) || "kund";

    // ✅ Använd kundens email direkt från faktura-objektet
    const customerEmail = faktura.kundemail?.trim();

    if (!customerEmail || !isValidEmail(customerEmail)) {
      return NextResponse.json({ error: "Ogiltig mottagare e-postadress" }, { status: 400 });
    }

    const företagsnamn = sanitizeText(faktura.företagsnamn) || "Företag";
    const fakturanummer = sanitizeText(faktura.fakturanummer) || "";
    const subject = `Faktura #${fakturanummer} från ${företagsnamn}`;

    // Ta bort känslig logging i produktion
    if (process.env.NODE_ENV === "development") {
      console.log("📧 Skickar faktura email"); // Logga bara i development
    }

    const emailOptions: any = {
      from: process.env.RESEND_FROM_EMAIL || "Faktura <onboarding@resend.dev>",
      to: [customerEmail], // ← ÄNDRAT: Skicka alltid till kundens email
      subject: subject,
      react: EmailTemplate({ firstName, faktura, customMessage }),
    };

    // Validera PDF-attachment om det finns
    if (pdfAttachment) {
      // Begränsa storlek (base64 encoding gör filen ~33% större)
      if (pdfAttachment.length > 7 * 1024 * 1024) {
        // ~5MB efter base64
        return NextResponse.json({ error: "PDF-fil för stor" }, { status: 400 });
      }

      emailOptions.attachments = [
        {
          filename: filename,
          content: pdfAttachment,
        },
      ];
    }

    const { data, error } = await resend.emails.send(emailOptions);

    if (error) {
      console.error("Email sending failed:", error.message); // Logga bara felmeddelande
      return NextResponse.json({ error: "Kunde inte skicka e-post" }, { status: 400 });
    }

    return NextResponse.json({
      data,
      message: `E-post skickad`,
    });
  } catch (error: any) {
    console.error("Server error:", error.message); // Logga bara felmeddelande
    return NextResponse.json({ error: "Fel vid skickande av e-post" }, { status: 500 });
  }
}
