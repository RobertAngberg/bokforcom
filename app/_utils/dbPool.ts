import { Pool } from "pg";

// Centraliserad pg-pool (singleton). Flyttad hit från /db/pool.ts.
// OBS: Om vi senare inför migrations/RLS/bootstrap kan en separat `db/` katalog återinföras.

declare global {
  // eslint-disable-next-line no-var
  var __APP_PG_POOL__: Pool | undefined;
}

export function getPool(): Pool {
  if (!globalThis.__APP_PG_POOL__) {
    globalThis.__APP_PG_POOL__ = new Pool({
      connectionString: process.env.DATABASE_URL,
      // ssl: { rejectUnauthorized: false }, // Avkommentera vid behov för Neon
    });

    globalThis.__APP_PG_POOL__.on("error", (err) => {
      console.error("[DB] Pool error:", err);
    });

    if (process.env.NODE_ENV !== "production") {
      console.log("[DB] Created new pg Pool instance (dbPool)");
    }
  }
  return globalThis.__APP_PG_POOL__;
}

export const pool = getPool();
