import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Pool } from "@neondatabase/serverless";

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    // Validering
    if (!email || !password || !name) {
      return NextResponse.json({ error: "Alla fält krävs" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Lösenordet måste vara minst 6 tecken" }, { status: 400 });
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    // Kolla om användaren redan finns
    const existingUser = await pool.query("SELECT id FROM users WHERE email = $1", [email]);

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: "En användare med denna e-post finns redan" },
        { status: 400 }
      );
    }

    // Hasha lösenordet
    const hashedPassword = await bcrypt.hash(password, 12);

    // Skapa användaren
    const result = await pool.query(
      "INSERT INTO users (email, name, password, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id, email, name",
      [email, name, hashedPassword]
    );

    const user = result.rows[0];

    return NextResponse.json(
      { message: "Användare skapad", user: { id: user.id, email: user.email, name: user.name } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Serverfel" }, { status: 500 });
  }
}
