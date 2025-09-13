import { Pool } from "pg";

// Global singleton pattern to avoid creating multiple pools in dev (hot reload) or prod
// This ensures predictable connection usage and easier future enhancements (RLS context, metrics, etc.)
declare global {
  // eslint-disable-next-line no-var
  var __APP_PG_POOL__: Pool | undefined;
}

export function getPool(): Pool {
  if (!globalThis.__APP_PG_POOL__) {
    globalThis.__APP_PG_POOL__ = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Uncomment ssl below if Neon / hosting requires explicit TLS negotiation
      // ssl: { rejectUnauthorized: false },
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
