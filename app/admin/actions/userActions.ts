"use server";

import { requireAdmin } from "../lib/adminAuth";
import { Pool } from "@neondatabase/serverless";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function getAllUsers() {
  try {
    // Ensure admin access
    await requireAdmin();

    // Query Better Auth's user table
    // Better Auth typically creates a "user" table
    const result = await pool.query(`
      SELECT 
        id,
        email,
        name,
        "createdAt",
        "emailVerified"
      FROM "user"
      ORDER BY "createdAt" DESC
    `);

    return {
      success: true,
      users: result.rows,
    };
  } catch (error) {
    console.error("Get users error:", error);

    if (error instanceof Error && error.message.includes('relation "user" does not exist')) {
      // Try alternative table names that Better Auth might use
      try {
        const altResult = await pool.query(`
          SELECT 
            id,
            email,
            name,
            created_at as "createdAt",
            email_verified as "emailVerified"
          FROM users
          ORDER BY created_at DESC
        `);

        return {
          success: true,
          users: altResult.rows,
        };
      } catch (altError) {
        console.error("Alternative users query failed:", altError);
        return {
          success: false,
          error: "Could not find user table",
          users: [],
        };
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      users: [],
    };
  }
}

export async function getUserById(userId: string) {
  try {
    await requireAdmin();

    const result = await pool.query(
      `
      SELECT 
        id,
        email,
        name,
        "createdAt",
        "emailVerified"
      FROM "user"
      WHERE id = $1
    `,
      [userId]
    );

    if (result.rows.length === 0) {
      return {
        success: false,
        error: "User not found",
      };
    }

    return {
      success: true,
      user: result.rows[0],
    };
  } catch (error) {
    console.error("Get user by ID error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
