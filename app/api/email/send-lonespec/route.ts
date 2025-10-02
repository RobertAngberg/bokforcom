import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { auth } from "../../../_lib/better-auth";
import { headers } from "next/headers";

const resend = new Resend(process.env.AUTH_RESEND_KEY);

// Säker email-validering
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// Säker text-sanitization
function sanitizeText(text: string): string {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(/[<>'"&]/g, "") // Ta bort farliga tecken
    .trim()
    .substring(0, 100); // Begränsa längd
}

export async function POST(req: NextRequest) {
  try {
    // ✅ Auth check
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Ej autentiserad" }, { status: 401 });
    }

    // Kontrollera API-nyckel först
    if (!process.env.AUTH_RESEND_KEY) {
      console.error("No Resend API key configured");
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 });
    }

    const formData = await req.formData();
    const pdfFile = formData.get("pdf") as File;
    const rawEmail = formData.get("email") as string;
    const rawNamn = formData.get("namn") as string;

    // Säker validering och sanitization
    const email = rawEmail?.trim();
    const namn = sanitizeText(rawNamn);

    // Validera inputs
    if (!email || !isValidEmail(email)) {
      console.error("Invalid email:", email);
      return NextResponse.json({ error: "Ogiltig e-postadress" }, { status: 400 });
    }

    if (!namn || namn.length < 1) {
      console.error("Invalid namn - received:", `'${rawNamn}' -> '${namn}'`);
      return NextResponse.json(
        {
          error:
            "Namn krävs för att skicka lönespecifikation. Kontrollera att anställds för- och efternamn är ifyllt.",
        },
        { status: 400 }
      );
    }

    if (!pdfFile || pdfFile.type !== "application/pdf") {
      console.error("Invalid PDF file:", { type: pdfFile?.type, exists: !!pdfFile });
      return NextResponse.json({ error: "Giltig PDF-fil krävs" }, { status: 400 });
    }

    // Begränsa PDF-storlek (8MB efter komprimering)
    if (pdfFile.size > 8 * 1024 * 1024) {
      console.error("PDF too large:", pdfFile.size);
      return NextResponse.json({ error: "PDF-fil för stor (max 8MB)" }, { status: 400 });
    }

    const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());

    // Säker email-sending utan känslig logging
    const { error } = await resend.emails.send({
      from: "info@xn--bokfr-mua.com",
      to: email,
      subject: "Din lönespecifikation",
      html: `<p>Hej ${namn},<br/>Här kommer din lönespecifikation som PDF.<br/><br/>Vänliga hälsningar,<br/>Lönesystemet</p>`,
      attachments: [
        {
          filename: "lonespec.pdf",
          content: pdfBuffer,
        },
      ],
    });

    if (error) {
      console.error("Email sending failed:", error.message); // Logga bara felmeddelande
      return NextResponse.json({ error: "Kunde inte skicka e-post" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Lönespecifikation skickad" });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("API error:", errorMessage); // Logga bara felmeddelande
    return NextResponse.json({ error: "Ett fel uppstod vid skickande av e-post" }, { status: 500 });
  }
}
