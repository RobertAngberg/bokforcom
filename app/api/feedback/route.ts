import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../_lib/better-auth";
import { headers } from "next/headers";
import { Resend } from "resend";

const resend = new Resend(process.env.AUTH_RESEND_KEY);

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const body = await request.json();
    const { message, type } = body;

    if (!message) {
      return NextResponse.json({ error: "Meddelande krävs" }, { status: 400 });
    }

    // Bestäm emoji baserat på typ
    const typeEmojis: Record<string, string> = {
      feedback: "💡",
      bug: "🐛",
      support: "❓",
      feature: "✨",
    };

    const emoji = typeEmojis[type] || "💬";

    // Samla användarinfo
    const userInfo = session?.user
      ? {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
        }
      : {
          id: "Ej inloggad",
          name: "Anonym användare",
          email: "Ingen email",
        };

    // Skicka email till dig
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: "robertangberg@gmail.com",
      subject: `BokförPunktCom - ${emoji} ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">${emoji} Ny ${type} från BokförPunktCom</h2>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Användarinformation:</h3>
            <p><strong>ID:</strong> ${userInfo.id}</p>
            <p><strong>Namn:</strong> ${userInfo.name}</p>
            <p><strong>Email:</strong> ${userInfo.email}</p>
          </div>

          <div style="background: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #1e293b;">Meddelande:</h3>
            <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
          </div>

          <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #92400e;">
              <strong>Svarstid:</strong> Återkom inom 24 timmar via email till ${userInfo.email}
            </p>
          </div>
        </div>
      `,
    });

    // Skicka bekräftelsemail till användaren (om inloggad)
    if (session?.user?.email) {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: session.user.email,
        subject: `Tack för din feedback - BokförPunktCom`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Tack för din feedback! 🙏</h2>
            
            <p>Hej ${session.user.name},</p>
            
            <p>Vi har tagit emot din ${type} och ska titta på det så snart som möjligt.</p>
            
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Din feedback:</h3>
              <p><strong>Typ:</strong> ${emoji} ${type.charAt(0).toUpperCase() + type.slice(1)}</p>
              <p><strong>Meddelande:</strong> ${message}</p>
            </div>
            
            <p>Vi återkommer vanligtvis inom 24 timmar.</p>
            
            <p>Tack för att du hjälper oss förbättra BokförPunktCom!</p>
            
            <p>Med vänliga hälsningar,<br/>
            BokförPunktCom Team</p>
          </div>
        `,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Feedback skickad!",
    });
  } catch (error) {
    console.error("Feedback error:", error);
    return NextResponse.json({ error: "Kunde inte skicka feedback" }, { status: 500 });
  }
}
