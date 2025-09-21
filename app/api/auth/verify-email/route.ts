import { NextRequest, NextResponse } from "next/server";
import { Pool } from "@neondatabase/serverless";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Verifieringstoken saknas" }, { status: 400 });
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // Hitta användare med token
    const result = await pool.query(
      `SELECT id, email, name, verification_expires 
       FROM users 
       WHERE verification_token = $1 AND email_verified = FALSE`,
      [token]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Ogiltig eller redan använd verifieringstoken" },
        { status: 400 }
      );
    }

    const user = result.rows[0];

    // Kontrollera om token har gått ut
    if (new Date() > new Date(user.verification_expires)) {
      return NextResponse.json(
        { error: "Verifieringstoken har gått ut. Begär en ny." },
        { status: 400 }
      );
    }

    // Verifiera användaren
    await pool.query(
      `UPDATE users 
       SET email_verified = TRUE, verification_token = NULL, verification_expires = NULL 
       WHERE id = $1`,
      [user.id]
    );

    console.log(`✅ Email verified for user: ${user.email}`);

    // Redirect till login med success-meddelande
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/login?verified=true`
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json({ error: "Verifieringsfel" }, { status: 500 });
  }
}
