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
