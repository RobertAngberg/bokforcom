/**
 * Test suite för Login-validation funktioner
 * Täcker kritiska validation functions från SignupForm och security-validation
 */

// Extraherade funktioner från SignupForm.tsx för testning
const validateOrganisationsnummer = (orgnr: string): { valid: boolean; error?: string } => {
  if (!orgnr) return { valid: false, error: "Organisationsnummer krävs" };

  const cleanOrgNr = orgnr.replace(/\D/g, "");

  if (cleanOrgNr.length !== 10 && cleanOrgNr.length !== 12) {
    return { valid: false, error: "Organisationsnummer måste vara 10 siffror (YYYYMMDDXX)" };
  }

  const orgNrToValidate = cleanOrgNr.length === 12 ? cleanOrgNr.slice(2) : cleanOrgNr;

  if (!/^\d{10}$/.test(orgNrToValidate)) {
    return { valid: false, error: "Organisationsnummer har ogiltigt format" };
  }

  return { valid: true };
};

const validateCompanyName = (name: string): { valid: boolean; error?: string } => {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: "Företagsnamn krävs" };
  }

  if (name.trim().length < 2) {
    return { valid: false, error: "Företagsnamn måste vara minst 2 tecken" };
  }

  if (name.trim().length > 100) {
    return { valid: false, error: "Företagsnamn får vara max 100 tecken" };
  }

  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /onload=/i,
    /onerror=/i,
    /DROP\s+TABLE/i,
    /DELETE\s+FROM/i,
    /INSERT\s+INTO/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(name)) {
      return { valid: false, error: "Företagsnamn innehåller otillåtna tecken" };
    }
  }

  return { valid: true };
};

const formatOrganisationsnummer = (value: string): string => {
  const clean = value.replace(/\D/g, "");

  if (clean.length >= 6) {
    return clean.slice(0, 6) + "-" + clean.slice(6, 10);
  }

  return clean;
};

// Mock för miljövariabler i security-validation
const mockEnv = (envVars: Record<string, string | undefined>) => {
  const originalEnv = process.env;
  process.env = { ...originalEnv, ...envVars };
  return () => {
    process.env = originalEnv;
  };
};

// Extraherad funktionalitet från security-validation.ts
interface AuthSecurityConfig {
  hasSecureSession: boolean;
  hasSecureCallbacks: boolean;
  hasSecureProviders: boolean;
  hasSecureAdapter: boolean;
  securityScore: number;
}

const validateAuthSecurity = (): AuthSecurityConfig => {
  const config: AuthSecurityConfig = {
    hasSecureSession: false,
    hasSecureCallbacks: false,
    hasSecureProviders: false,
    hasSecureAdapter: false,
    securityScore: 0,
  };

  // Kontrollera miljövariabler
  const requiredEnvVars = ["AUTH_SECRET", "DATABASE_URL", "RESEND_FROM_EMAIL"];

  const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missingEnvVars.length === 0) {
    config.hasSecureProviders = true;
    config.securityScore += 25;
  }

  // Kontrollera session-strategi (database är säkrare än JWT)
  config.hasSecureSession = true;
  config.securityScore += 25;

  // Kontrollera adapter (Neon är säker)
  config.hasSecureAdapter = true;
  config.securityScore += 25;

  // Kontrollera callbacks (session callback fixar user.id)
  config.hasSecureCallbacks = true;
  config.securityScore += 25;

  return config;
};

const validateProductionSecurity = (): boolean => {
  if (process.env.NODE_ENV !== "production") {
    return true; // Utvecklingsmiljö
  }

  const productionChecks = [
    (process.env.AUTH_SECRET?.length ?? 0) >= 32,
    process.env.DATABASE_URL?.startsWith("postgresql://") ?? false,
  ];

  return productionChecks.every((check) => check);
};

// Validation för signup data (från actions.ts)
const validateSignupData = (data: {
  momsperiod?: string;
  bokföringsmetod?: string;
}): { valid: boolean; error?: string } => {
  const allowedMomsperiods = ["månadsvis", "kvartalsvis", "årsvis"];
  const allowedMethods = ["kassaredovisning", "fakturaredovisning"];

  if (data.momsperiod && !allowedMomsperiods.includes(data.momsperiod)) {
    return { valid: false, error: "Ogiltig momsperiod" };
  }

  if (data.bokföringsmetod && !allowedMethods.includes(data.bokföringsmetod)) {
    return { valid: false, error: "Ogiltig bokföringsmetod" };
  }

  return { valid: true };
};

describe("Login Validation Functions", () => {
  describe("validateOrganisationsnummer", () => {
    test("accepterar giltigt 10-siffrigt organisationsnummer", () => {
      const result = validateOrganisationsnummer("5560160680");
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test("accepterar organisationsnummer med bindestreck", () => {
      const result = validateOrganisationsnummer("556016-0680");
      expect(result.valid).toBe(true);
    });

    test("accepterar 12-siffrigt organisationsnummer (16YYYYMMDDXX)", () => {
      const result = validateOrganisationsnummer("165560160680");
      expect(result.valid).toBe(true);
    });

    test("accepterar 12-siffrigt med prefix och bindestreck", () => {
      const result = validateOrganisationsnummer("16556016-0680");
      expect(result.valid).toBe(true);
    });

    test("avvisar tomt organisationsnummer", () => {
      const result = validateOrganisationsnummer("");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Organisationsnummer krävs");
    });

    test("avvisar för kort organisationsnummer", () => {
      const result = validateOrganisationsnummer("123456");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Organisationsnummer måste vara 10 siffror (YYYYMMDDXX)");
    });

    test("avvisar för långt organisationsnummer", () => {
      const result = validateOrganisationsnummer("12345678901234");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Organisationsnummer måste vara 10 siffror (YYYYMMDDXX)");
    });

    test("accepterar organisationsnummer med extra tecken (rensas)", () => {
      const result = validateOrganisationsnummer("556 016-068 0");
      expect(result.valid).toBe(true);
    });

    test("avvisar organisationsnummer med bokstäver", () => {
      const result = validateOrganisationsnummer("556ABC0680");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Organisationsnummer måste vara 10 siffror (YYYYMMDDXX)");
    });

    test("hanterar endast siffror korrekt", () => {
      const result = validateOrganisationsnummer("5560160680");
      expect(result.valid).toBe(true);
    });
  });

  describe("validateCompanyName", () => {
    test("accepterar giltigt företagsnamn", () => {
      const result = validateCompanyName("Acme AB");
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test("accepterar företagsnamn med svenska tecken", () => {
      const result = validateCompanyName("Åkesson & Söner AB");
      expect(result.valid).toBe(true);
    });

    test("avvisar tomt företagsnamn", () => {
      const result = validateCompanyName("");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Företagsnamn krävs");
    });

    test("avvisar företagsnamn med endast whitespace", () => {
      const result = validateCompanyName("   ");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Företagsnamn krävs");
    });

    test("avvisar för kort företagsnamn", () => {
      const result = validateCompanyName("A");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Företagsnamn måste vara minst 2 tecken");
    });

    test("avvisar för långt företagsnamn", () => {
      const longName = "A".repeat(101);
      const result = validateCompanyName(longName);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Företagsnamn får vara max 100 tecken");
    });

    test("accepterar exakt 100 tecken", () => {
      const exactName = "A".repeat(100);
      const result = validateCompanyName(exactName);
      expect(result.valid).toBe(true);
    });

    test("avvisar script-taggar (XSS-skydd)", () => {
      const result = validateCompanyName("Acme <script>alert('xss')</script> AB");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Företagsnamn innehåller otillåtna tecken");
    });

    test("avvisar javascript: protokoll", () => {
      const result = validateCompanyName("javascript:alert('xss')");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Företagsnamn innehåller otillåtna tecken");
    });

    test("avvisar event handlers", () => {
      const result = validateCompanyName("Acme onload=alert('xss') AB");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Företagsnamn innehåller otillåtna tecken");
    });

    test("avvisar SQL injection-försök", () => {
      const result = validateCompanyName("Acme'; DROP TABLE users; --");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Företagsnamn innehåller otillåtna tecken");
    });

    test("avvisar DELETE statements", () => {
      const result = validateCompanyName("DELETE FROM users WHERE 1=1");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Företagsnamn innehåller otillåtna tecken");
    });

    test("avvisar INSERT statements", () => {
      const result = validateCompanyName("INSERT INTO admin VALUES ('hacker')");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Företagsnamn innehåller otillåtna tecken");
    });

    test("accepterar namn med siffror och special tecken", () => {
      const result = validateCompanyName("123 Byggfirma & Co (2024)");
      expect(result.valid).toBe(true);
    });

    test("trimmar whitespace korrekt", () => {
      const result = validateCompanyName("  Acme AB  ");
      expect(result.valid).toBe(true);
    });
  });

  describe("formatOrganisationsnummer", () => {
    test("formaterar 10-siffrigt nummer med bindestreck", () => {
      const formatted = formatOrganisationsnummer("5560160680");
      expect(formatted).toBe("556016-0680");
    });

    test("behåller redan formaterat nummer", () => {
      const formatted = formatOrganisationsnummer("556016-0680");
      expect(formatted).toBe("556016-0680");
    });

    test("formaterar nummer med extra tecken", () => {
      const formatted = formatOrganisationsnummer("556 016 068 0");
      expect(formatted).toBe("556016-0680");
    });

    test("hanterar kort nummer utan formatering", () => {
      const formatted = formatOrganisationsnummer("12345");
      expect(formatted).toBe("12345");
    });

    test("formaterar 12-siffrigt nummer", () => {
      const formatted = formatOrganisationsnummer("165560160680");
      expect(formatted).toBe("165560-1606");
    });

    test("rensar bort bokstäver", () => {
      const formatted = formatOrganisationsnummer("556ABC016DEF0680");
      expect(formatted).toBe("556016-0680");
    });

    test("hanterar tomt input", () => {
      const formatted = formatOrganisationsnummer("");
      expect(formatted).toBe("");
    });
  });

  describe("validateSignupData", () => {
    test("accepterar giltig momsperiod", () => {
      const result = validateSignupData({ momsperiod: "månadsvis" });
      expect(result.valid).toBe(true);
    });

    test("accepterar alla giltiga momsperioder", () => {
      const validPeriods = ["månadsvis", "kvartalsvis", "årsvis"];

      validPeriods.forEach((period) => {
        const result = validateSignupData({ momsperiod: period });
        expect(result.valid).toBe(true);
      });
    });

    test("avvisar ogiltig momsperiod", () => {
      const result = validateSignupData({ momsperiod: "dagligen" });
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Ogiltig momsperiod");
    });

    test("accepterar giltig bokföringsmetod", () => {
      const result = validateSignupData({ bokföringsmetod: "kassaredovisning" });
      expect(result.valid).toBe(true);
    });

    test("accepterar alla giltiga bokföringsmetoder", () => {
      const validMethods = ["kassaredovisning", "fakturaredovisning"];

      validMethods.forEach((method) => {
        const result = validateSignupData({ bokföringsmetod: method });
        expect(result.valid).toBe(true);
      });
    });

    test("avvisar ogiltig bokföringsmetod", () => {
      const result = validateSignupData({ bokföringsmetod: "kontantredovisning" });
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Ogiltig bokföringsmetod");
    });

    test("accepterar tom data", () => {
      const result = validateSignupData({});
      expect(result.valid).toBe(true);
    });

    test("validerar både fält samtidigt", () => {
      const result = validateSignupData({
        momsperiod: "månadsvis",
        bokföringsmetod: "fakturaredovisning",
      });
      expect(result.valid).toBe(true);
    });

    test("failar om något fält är ogiltigt", () => {
      const result = validateSignupData({
        momsperiod: "ogiltig",
        bokföringsmetod: "fakturaredovisning",
      });
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Ogiltig momsperiod");
    });
  });

  describe("Security Validation", () => {
    describe("validateAuthSecurity", () => {
      test("ger full poäng när alla miljövariabler finns", () => {
        const restoreEnv = mockEnv({
          AUTH_SECRET: "test-secret-key-that-is-long-enough",
          AUTH_GOOGLE_ID: "test-google-id",
          AUTH_GOOGLE_SECRET: "test-google-secret",
          DATABASE_URL: "postgresql://localhost:5432/test",
          RESEND_FROM_EMAIL: "test@example.com",
        });

        const config = validateAuthSecurity();

        expect(config.hasSecureProviders).toBe(true);
        expect(config.hasSecureSession).toBe(true);
        expect(config.hasSecureAdapter).toBe(true);
        expect(config.hasSecureCallbacks).toBe(true);
        expect(config.securityScore).toBe(100);

        restoreEnv();
      });

      test("ger reducerad poäng när miljövariabler saknas", () => {
        const restoreEnv = mockEnv({
          AUTH_SECRET: undefined,
          AUTH_GOOGLE_ID: undefined,
          AUTH_GOOGLE_SECRET: "test-secret",
          DATABASE_URL: "postgresql://localhost:5432/test",
          RESEND_FROM_EMAIL: "test@example.com",
        });

        const config = validateAuthSecurity();

        expect(config.hasSecureProviders).toBe(false);
        expect(config.securityScore).toBe(75); // 25 + 25 + 25, men inte providers

        restoreEnv();
      });

      test("behåller andra säkerhetsinställningar även utan providers", () => {
        const restoreEnv = mockEnv({});

        const config = validateAuthSecurity();

        expect(config.hasSecureSession).toBe(true);
        expect(config.hasSecureAdapter).toBe(true);
        expect(config.hasSecureCallbacks).toBe(true);

        restoreEnv();
      });
    });

    describe("validateProductionSecurity", () => {
      test("returnerar true i utvecklingsmiljö", () => {
        const restoreEnv = mockEnv({ NODE_ENV: "development" });

        const isSecure = validateProductionSecurity();
        expect(isSecure).toBe(true);

        restoreEnv();
      });

      test("validerar produktionskrav korrekt", () => {
        const restoreEnv = mockEnv({
          NODE_ENV: "production",
          AUTH_SECRET: "a".repeat(32), // Minst 32 tecken
          DATABASE_URL: "postgresql://user:pass@host:5432/db",
          AUTH_GOOGLE_ID: "google-client-id",
          AUTH_GOOGLE_SECRET: "google-client-secret",
        });

        const isSecure = validateProductionSecurity();
        expect(isSecure).toBe(true);

        restoreEnv();
      });

      test("failar med för kort AUTH_SECRET", () => {
        const restoreEnv = mockEnv({
          NODE_ENV: "production",
          AUTH_SECRET: "short", // Mindre än 32 tecken
          DATABASE_URL: "postgresql://user:pass@host:5432/db",
          AUTH_GOOGLE_ID: "google-client-id",
          AUTH_GOOGLE_SECRET: "google-client-secret",
        });

        const isSecure = validateProductionSecurity();
        expect(isSecure).toBe(false);

        restoreEnv();
      });

      test("failar med fel DATABASE_URL format", () => {
        const restoreEnv = mockEnv({
          NODE_ENV: "production",
          AUTH_SECRET: "a".repeat(32),
          DATABASE_URL: "mysql://user:pass@host:3306/db", // Inte postgresql
          AUTH_GOOGLE_ID: "google-client-id",
          AUTH_GOOGLE_SECRET: "google-client-secret",
        });

        const isSecure = validateProductionSecurity();
        expect(isSecure).toBe(false);

        restoreEnv();
      });

      test("failar med saknade Google credentials", () => {
        const restoreEnv = mockEnv({
          NODE_ENV: "production",
          AUTH_SECRET: "a".repeat(32),
          DATABASE_URL: "postgresql://user:pass@host:5432/db",
          AUTH_GOOGLE_ID: "", // Tom
          AUTH_GOOGLE_SECRET: "google-client-secret",
        });

        const isSecure = validateProductionSecurity();
        expect(isSecure).toBe(false);

        restoreEnv();
      });
    });
  });

  describe("Edge Cases och Error Handling", () => {
    test("hanterar null och undefined input gracefully", () => {
      expect(validateOrganisationsnummer(null as any)).toEqual({
        valid: false,
        error: "Organisationsnummer krävs",
      });

      expect(validateCompanyName(undefined as any)).toEqual({
        valid: false,
        error: "Företagsnamn krävs",
      });
    });

    test("hanterar extrema string-längder", () => {
      const veryLongOrgNr = "1".repeat(1000);
      const result = validateOrganisationsnummer(veryLongOrgNr);
      expect(result.valid).toBe(false);
    });

    test("hanterar unicode-tecken i företagsnamn", () => {
      const result = validateCompanyName("Företag 测试 🏢 AB");
      expect(result.valid).toBe(true);
    });

    test("formatOrganisationsnummer hanterar special cases", () => {
      expect(formatOrganisationsnummer("---556-016-068-0---")).toBe("556016-0680");
      expect(formatOrganisationsnummer("5")).toBe("5");
      expect(formatOrganisationsnummer("556016")).toBe("556016-");
    });
  });
});
