// Server Actions Rate Limiting Wrapper
// Skyddar server actions från missbruk och spam

import { apiRateLimit, createRateLimitIdentifier } from "./rateLimit";

type ServerActionFunction = (...args: any[]) => Promise<any>;

// Wrapper för att lägga till rate limiting på server actions
export function withRateLimit(
  action: ServerActionFunction,
  options?: {
    windowMs?: number;
    maxRequests?: number;
    identifier?: string; // Custom identifier istället för IP
  }
): ServerActionFunction {
  return async (...args: any[]) => {
    try {
      // Skapa identifier baserat på options eller använd default
      const identifier = options?.identifier || "server-action";

      // Kontrollera rate limiting
      const rateLimitResult = apiRateLimit(identifier);

      if (!rateLimitResult.allowed) {
        throw new Error(
          `Rate limit exceeded. Try again in ${Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)} seconds.`
        );
      }

      // Kör den ursprungliga actionen
      return await action(...args);
    } catch (error) {
      // Log säkerhetsrelaterade fel
      if (error instanceof Error && error.message.includes("Rate limit")) {
        console.warn(
          `🚨 Rate limit hit for action: ${action.name}, identifier: ${options?.identifier || "server-action"}`
        );
      }
      throw error;
    }
  };
}

// Förkonfigurerad rate limiter för olika typer av actions
export const withEmailRateLimit = (action: ServerActionFunction) =>
  withRateLimit(action, { windowMs: 60 * 60 * 1000, maxRequests: 5 }); // 5 per timme

export const withFormRateLimit = (action: ServerActionFunction) =>
  withRateLimit(action, { windowMs: 15 * 60 * 1000, maxRequests: 20 }); // 20 per 15 min

export const withSearchRateLimit = (action: ServerActionFunction) =>
  withRateLimit(action, { windowMs: 60 * 1000, maxRequests: 30 }); // 30 per minut
