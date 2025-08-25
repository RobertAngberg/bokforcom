// Rate limiting utility för API-säkerhet
// Förhindrar spam, brute force-attacker och DDoS

type RateLimitConfig = {
  windowMs: number; // Tidsfönster i millisekunder
  maxRequests: number; // Max antal requests per tidsfönster
  message?: string; // Felmeddelande
};

type RateLimitEntry = {
  count: number;
  resetTime: number;
  firstRequest: number;
};

// In-memory storage för rate limiting (i produktion bör detta vara Redis/databas)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Rensa gamla entries periodiskt
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Rensa varje minut

export function createRateLimit(config: RateLimitConfig) {
  return function rateLimit(identifier: string): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  } {
    const now = Date.now();
    const key = identifier;

    let entry = rateLimitStore.get(key);

    // Om ingen entry finns eller tidsfönstret har passerat, skapa ny
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 1,
        resetTime: now + config.windowMs,
        firstRequest: now,
      };
      rateLimitStore.set(key, entry);

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: entry.resetTime,
      };
    }

    // Öka räknaren
    entry.count++;

    // Kontrollera om gränsen är nådd
    if (entry.count > config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  };
}

// Förkonfigurerade rate limiters för olika API-endpoints
export const apiRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuter
  maxRequests: 100, // Max 100 requests per 15 min
  message: "För många API-anrop. Försök igen senare.",
});

export const emailRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 timme
  maxRequests: 10, // Max 10 emails per timme
  message: "För många email-försök. Försök igen om en timme.",
});

export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuter
  maxRequests: 5, // Max 5 login-försök per 15 min
  message: "För många inloggningsförsök. Försök igen om 15 minuter.",
});

// Utility för att få IP-adress från request
export function getClientIP(request: Request): string {
  // Försök olika headers för IP (bakom proxy, load balancer etc)
  const headers = [
    "x-forwarded-for",
    "x-real-ip",
    "x-client-ip",
    "cf-connecting-ip", // Cloudflare
    "x-forwarded",
    "forwarded-for",
    "forwarded",
  ];

  for (const header of headers) {
    const value = request.headers.get(header);
    if (value) {
      // Ta första IP om flera (kommaseparerade)
      const ip = value.split(",")[0].trim();
      if (ip && ip !== "unknown") {
        return ip;
      }
    }
  }

  // Fallback IP om inga headers finns
  return "unknown";
}

// Utility för att skapa säker identifier (IP + user ID om tillgänglig)
export function createRateLimitIdentifier(request: Request, userId?: string): string {
  const ip = getClientIP(request);
  const userAgent = request.headers.get("user-agent") || "unknown";

  // Inkludera userId om tillgängligt för per-user limiting
  if (userId) {
    return `${ip}:${userId}`;
  }

  // Annars bara IP + user agent hash för anonym rate limiting
  const hash = btoa(userAgent).substring(0, 8);
  return `${ip}:${hash}`;
}

// 🔒 UNIFIED SESSION-BASED RATE LIMITING
// Migrerat från actionRateLimit.ts för konsistens

/**
 * Session-based rate limiting för server actions
 * Perfekt för att begränsa känsliga operationer per användare
 */
export function createSessionRateLimit(config: { maxAttempts: number; windowMs: number }) {
  const sessionAttempts = new Map<string, { attempts: number; lastAttempt: number }>();

  return function validateSessionAttempt(sessionId: number | string): boolean {
    const sessionKey = String(sessionId);
    const now = Date.now();

    const userAttempts = sessionAttempts.get(sessionKey) || { attempts: 0, lastAttempt: 0 };

    // Reset om window har passerat
    if (now - userAttempts.lastAttempt > config.windowMs) {
      userAttempts.attempts = 0;
    }

    // Kolla om limit är nådd
    if (userAttempts.attempts >= config.maxAttempts) {
      console.warn(`🚨 Session rate limit exceeded för session: ${sessionKey}`);
      return false;
    }

    // Uppdatera räknare
    userAttempts.attempts++;
    userAttempts.lastAttempt = now;
    sessionAttempts.set(sessionKey, userAttempts);

    return true;
  };
}

/**
 * Hybrid rate limiting (session + IP) för signup-liknande operationer
 * Migrerat från signup/actions.ts
 */
export function createHybridRateLimit(config: {
  maxAttemptsPerSession: number;
  maxAttemptsPerIP: number;
  windowMs: number;
}) {
  const sessionAttempts = new Map<string, { attempts: number; lastAttempt: number }>();
  const ipAttempts = new Map<string, { attempts: number; lastAttempt: number }>();

  return function validateHybridAttempt(sessionId: string, ip?: string): boolean {
    const now = Date.now();

    // Kontrollera session-baserad rate limiting
    const userAttempts = sessionAttempts.get(sessionId) || { attempts: 0, lastAttempt: 0 };
    if (now - userAttempts.lastAttempt > config.windowMs) {
      userAttempts.attempts = 0;
    }

    if (userAttempts.attempts >= config.maxAttemptsPerSession) {
      console.warn(
        `🚨 Session rate limit exceeded: ${userAttempts.attempts} attempts for ${sessionId}`
      );
      return false;
    }

    // Kontrollera IP-baserad rate limiting om IP finns
    if (ip) {
      const ipUserAttempts = ipAttempts.get(ip) || { attempts: 0, lastAttempt: 0 };
      if (now - ipUserAttempts.lastAttempt > config.windowMs) {
        ipUserAttempts.attempts = 0;
      }

      if (ipUserAttempts.attempts >= config.maxAttemptsPerIP) {
        console.warn(`🚨 IP rate limit exceeded: ${ipUserAttempts.attempts} attempts for ${ip}`);
        return false;
      }

      // Uppdatera IP räknare
      ipUserAttempts.attempts++;
      ipUserAttempts.lastAttempt = now;
      ipAttempts.set(ip, ipUserAttempts);
    }

    // Uppdatera session räknare
    userAttempts.attempts++;
    userAttempts.lastAttempt = now;
    sessionAttempts.set(sessionId, userAttempts);

    return true;
  };
}

// 🎯 FÖRKONFIGURERADE RATE LIMITERS

// Session-based för write/mutation operationer
export const sessionRateLimit = createSessionRateLimit({
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minuter
});

// Session-based för read operationer (mer generöst)
export const readSessionRateLimit = createSessionRateLimit({
  maxAttempts: 50, // Många fler requests för läsoperationer
  windowMs: 15 * 60 * 1000, // 15 minuter
});

// Hybrid för signup-operationer (migrerat från signup/actions.ts)
export const signupRateLimit = createHybridRateLimit({
  maxAttemptsPerSession: 3,
  maxAttemptsPerIP: 10,
  windowMs: 15 * 60 * 1000, // 15 minuter
});

// Legacy alias för bakåtkompatibilitet
export const validateSessionAttempt = sessionRateLimit;

// 🎯 SERVER ACTION WRAPPERS (migrerat från actionRateLimit.ts)

type ServerActionFunction = (...args: any[]) => Promise<any>;

/**
 * Wrapper för att lägga till rate limiting på server actions
 * Migrerat från actionRateLimit.ts för unified approach
 */
export function withRateLimit(
  action: ServerActionFunction,
  options?: {
    windowMs?: number;
    maxRequests?: number;
    identifier?: string;
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

// Förkonfigurerade wrappers (migrerat från actionRateLimit.ts)
export const withEmailRateLimit = (action: ServerActionFunction) =>
  withRateLimit(action, { windowMs: 60 * 60 * 1000, maxRequests: 5 }); // 5 per timme

export const withFormRateLimit = (action: ServerActionFunction) =>
  withRateLimit(action, { windowMs: 15 * 60 * 1000, maxRequests: 20 }); // 20 per 15 min

export const withSearchRateLimit = (action: ServerActionFunction) =>
  withRateLimit(action, { windowMs: 60 * 1000, maxRequests: 30 }); // 30 per minut
