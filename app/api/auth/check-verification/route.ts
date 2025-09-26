import { NextRequest, NextResponse } from "next/server";
import { Pool } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email och lösenord krävs" }, { status: 400 });
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    const result = await pool.query(
      "SELECT id, email, password, email_verified FROM users WHERE email = $1",
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    // Kontrollera lösenord
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    // Kontrollera om email är verifierad
    if (!user.email_verified) {
      return NextResponse.json({ error: "EMAIL_NOT_VERIFIED" }, { status: 403 });
    }

    // Allt OK - användaren kan logga in
    return NextResponse.json({ status: "verified" });
  } catch (error) {
    console.error("Check verification error:", error);
    return NextResponse.json({ error: "Serverfel" }, { status: 500 });
  }
}
