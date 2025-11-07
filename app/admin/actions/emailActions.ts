"use server";

import { Resend } from "resend";
import { requireAdmin } from "../lib/adminAuth";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
}

export async function sendAdminEmail(params: SendEmailParams) {
  try {
    // Kontrollera admin-behörighet
    await requireAdmin();

    const { to, subject, html } = params;

    // Använd RESEND_FROM_EMAIL från .env (info@xn--bokfr-mua.com / info@bokför.com)
    const fromEmail =
      process.env.RESEND_FROM_EMAIL || process.env.ADMIN_FROM_EMAIL || "info@bokför.com";

    console.log(`📧 Sending admin email to: ${Array.isArray(to) ? to.join(", ") : to}`);

    const result = await resend.emails.send({
      from: fromEmail,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    console.log("✅ Admin email sent successfully:", result);

    return {
      success: true,
      data: result,
      message: "Email skickat framgångsrikt",
    };
  } catch (error) {
    console.error("❌ Failed to send admin email:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Kunde inte skicka email",
    };
  }
}

/**
 * Skicka email till en specifik användare
 */
export async function sendEmailToUser(userId: string, subject: string, html: string) {
  try {
    await requireAdmin();

    // Hämta användarens email
    const { pool } = await import("../../_lib/db");
    const result = await pool.query(`SELECT email FROM "user" WHERE id = $1`, [userId]);

    if (result.rows.length === 0) {
      return {
        success: false,
        error: "Användare hittades inte",
      };
    }

    const userEmail = result.rows[0].email;

    return await sendAdminEmail({
      to: userEmail,
      subject,
      html,
    });
  } catch (error) {
    console.error("❌ Failed to send email to user:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Kunde inte skicka email",
    };
  }
}

/**
 * Skicka email till flera användare
 */
export async function sendBulkEmail(userIds: string[], subject: string, html: string) {
  try {
    await requireAdmin();

    // Hämta email-adresser från databas
    const { pool } = await import("../../_lib/db");
    const result = await pool.query(`SELECT email FROM "user" WHERE id = ANY($1::text[])`, [
      userIds,
    ]);

    const emails = result.rows.map((row: { email: string }) => row.email);

    if (emails.length === 0) {
      return {
        success: false,
        error: "Inga giltiga email-adresser hittades",
      };
    }

    // Skicka email till alla
    const emailResult = await sendAdminEmail({
      to: emails,
      subject,
      html,
    });

    return {
      ...emailResult,
      emailsSent: emails.length,
    };
  } catch (error) {
    console.error("❌ Failed to send bulk email:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Kunde inte skicka bulk-email",
    };
  }
}
