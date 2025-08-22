import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { Pool } from "@neondatabase/serverless";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Ej autentiserad" }, { status: 401 });
    }

    const { name, email } = await request.json();

    // Validering
    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: "Namn och email får inte vara tomma" }, { status: 400 });
    }

    // Email validering
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Ogiltig email-adress" }, { status: 400 });
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    // Kolla om email redan används av annan användare
    const existingUser = await pool.query(`SELECT id FROM users WHERE email = $1 AND id != $2`, [
      email.trim(),
      session.user.id,
    ]);

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        {
          error: "Denna email-adress används redan av en annan användare",
        },
        { status: 400 }
      );
    }

    // Uppdatera användaren
    const result = await pool.query(
      `UPDATE users 
       SET name = $1, email = $2, uppdaterad = NOW() 
       WHERE id = $3 
       RETURNING id, email, name, skapad, uppdaterad`,
      [name.trim(), email.trim(), session.user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Användare inte funnen" }, { status: 404 });
    }

    const updatedUser = result.rows[0];

    // Hämta provider info
    const accountResult = await pool.query(
      `SELECT provider FROM accounts WHERE user_id = $1 LIMIT 1`,
      [session.user.id]
    );

    const provider = accountResult.rows.length > 0 ? accountResult.rows[0].provider : "credentials";

    const response = {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      skapad: updatedUser.skapad,
      uppdaterad: updatedUser.uppdaterad,
      provider: provider,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Kunde inte uppdatera användarinformation" },
      { status: 500 }
    );
  }
}
