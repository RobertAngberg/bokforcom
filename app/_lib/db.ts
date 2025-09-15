import { Pool } from "pg";

// Centraliserad databaskonfiguration - flytta hit från _utils för bättre organisation
// Singleton pattern för att återanvända samma connection pool

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
      console.log("[DB] Created new pg Pool instance");
    }
  }
  return globalThis.__APP_PG_POOL__;
}

export const pool = getPool();
