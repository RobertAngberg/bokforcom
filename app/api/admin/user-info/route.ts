import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { Pool } from "@neondatabase/serverless";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Ej autentiserad" }, { status: 401 });
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    // Hämta användarinfo från databas (utan lösenord)
    const userResult = await pool.query(
      `SELECT id, email, name, skapad, uppdaterad 
       FROM users 
       WHERE id = $1`,
      [session.user.id]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "Användare inte funnen" }, { status: 404 });
    }

    const user = userResult.rows[0];

    // Hämta account info för att se inloggningsmetod
    const accountResult = await pool.query(
      `SELECT provider 
       FROM accounts 
       WHERE user_id = $1 
       LIMIT 1`,
      [session.user.id]
    );

    const provider = accountResult.rows.length > 0 ? accountResult.rows[0].provider : "credentials";

    const response = {
      id: user.id,
      email: user.email,
      name: user.name,
      skapad: user.skapad,
      uppdaterad: user.uppdaterad,
      provider: provider,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching user info:", error);
    return NextResponse.json({ error: "Kunde inte hämta användarinformation" }, { status: 500 });
  }
}
