import { betterAuth } from "better-auth";
import { Pool } from "@neondatabase/serverless";
import { Resend } from "resend";
import { nextCookies } from "better-auth/next-js";

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true, // Aktiverar email verification!
    sendResetPassword: async ({ user, url }) => {
      console.log("🔑 Password reset for:", user.email);
      console.log("🔗 Reset URL:", url);

      try {
        const result = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "noreply@localhost",
          to: user.email,
          subject: "Återställ ditt lösenord",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333;">Hej ${user.name}!</h2>
              <p>Du har begärt att återställa ditt lösenord.</p>
              <p>Klicka på länken nedan för att sätta ett nytt lösenord:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${url}" 
                   style="background: #dc2626; color: white; padding: 12px 24px; 
                          text-decoration: none; border-radius: 6px; display: inline-block;
                          font-weight: bold;">
                  Återställ Lösenord
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                Om du inte kan klicka på knappen, kopiera denna länk:
                <br>
                <code style="background: #f5f5f5; padding: 2px 4px; border-radius: 3px;">${url}</code>
              </p>
              
              <p style="color: #666; font-size: 14px;">
                Denna länk är giltig i 1 timme.
              </p>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px;">
                Om du inte begärde att återställa ditt lösenord kan du ignorera detta mail.
              </p>
            </div>
          `,
        });

        console.log(`✅ Password reset email sent to ${user.email}`, result);
      } catch (error) {
        console.error("❌ Failed to send password reset email:", error);
        throw error;
      }
    },
  },

  emailVerification: {
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({
      user,
      url,
    }: {
      user: { name: string; email: string };
      url: string;
    }) => {
      console.log("🚀 sendVerificationEmail called for:", user.email);
      console.log("📧 Verification URL:", url);

      try {
        const result = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "noreply@localhost",
          to: user.email,
          subject: "Verifiera din email-adress",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333;">Hej ${user.name}!</h2>
              <p>Tack för att du registrerat dig på vår plattform.</p>
              <p>Klicka på länken nedan för att verifiera din email-adress:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${url}" 
                   style="background: #0070f3; color: white; padding: 12px 24px; 
                          text-decoration: none; border-radius: 6px; display: inline-block;
                          font-weight: bold;">
                  Verifiera Email
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                Om du inte kan klicka på knappen, kopiera denna länk:
                <br>
                <code style="background: #f5f5f5; padding: 2px 4px; border-radius: 3px;">${url}</code>
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

        console.log(`✅ Verification email sent to ${user.email}`, result);
        return;
      } catch (error) {
        console.error("❌ Failed to send verification email:", error);
        throw error;
      }
    },
  },

  session: {
    cookieCache: {
      enabled: true, // 🚀 DETTA VAR PROBLEMET!
      maxAge: 60 * 60 * 24 * 30, // 30 dagar (samma som din nuvarande setup)
    },
  },

  plugins: [
    nextCookies(), // Hanterar cookies automatiskt i server actions
  ],
});
