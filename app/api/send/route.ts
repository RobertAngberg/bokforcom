import { NextResponse } from "next/server";
import { Resend } from "resend";
import EmailTemplate from "./EmailTemplate";

const DEV_EMAIL = "info@xn--bokfr-mua.com";

export async function POST(request: Request) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is missing");
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const body = await request.json();
    const { faktura, pdfAttachment, filename = "faktura.pdf", customMessage } = body;
    const firstName = faktura.kundnamn?.split(" ")[0] || "kund";

    // ✅ Använd kundens email direkt från faktura-objektet
    const customerEmail = faktura.kundemail;

    if (!customerEmail || !customerEmail.includes("@")) {
      return NextResponse.json({ error: "Ogiltig mottagare e-postadress" }, { status: 400 });
    }

    const företagsnamn = faktura.företagsnamn || "Företag";
    const fakturanummer = faktura.fakturanummer || "";
    const subject = `Faktura #${fakturanummer} från ${företagsnamn}`;

    console.log("📧 Skickar till:", customerEmail); // Debug

    const emailOptions: any = {
      from: process.env.RESEND_FROM_EMAIL || "Faktura <onboarding@resend.dev>",
      to: [customerEmail], // ← ÄNDRAT: Skicka alltid till kundens email
      subject: subject,
      react: EmailTemplate({ firstName, faktura, customMessage }),
    };

    if (pdfAttachment) {
      emailOptions.attachments = [
        {
          filename: filename,
          content: pdfAttachment,
        },
      ];
    }

    const { data, error } = await resend.emails.send(emailOptions);

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      data,
      message: `E-post skickad till ${customerEmail}`,
    });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({ error: "Fel vid skickande av e-post" }, { status: 500 });
  }
}
