import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.AUTH_RESEND_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, message, website } = body;

    // HONEYPOT CHECK - om "website" är ifyllt är det en bot
    if (website) {
      console.log("🚫 Spam detected via honeypot");
      return NextResponse.json({ error: "Spam detected" }, { status: 400 });
    }

    // Validera required fields
    if (!name || !email || !message) {
      return NextResponse.json({ error: "Alla fält krävs" }, { status: 400 });
    }

    // Validera email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Ogiltig email-adress" }, { status: 400 });
    }

    // Skicka email till info@bokför.com (Punycode: xn--bokfr-mua.com)
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: "info@xn--bokfr-mua.com",
      replyTo: email,
      subject: `Kontakt från ${name} - BokförPunktCom`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">📧 Nytt kontaktmeddelande</h2>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Namn:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
          </div>

          <div style="background: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #1e293b;">Meddelande:</h3>
            <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
          </div>

          <div style="margin-top: 20px; padding: 10px; background: #e0f2fe; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #0369a1;">
              💡 Svara genom att bara klicka reply - emailen går direkt till ${email}
            </p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Kontakt error:", error);
    return NextResponse.json({ error: "Något gick fel. Försök igen senare." }, { status: 500 });
  }
}
