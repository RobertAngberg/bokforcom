// 🔒 AUTH ENVIRONMENT VALIDATION
// Lägg till detta i en startup check eller middleware

export function validateAuthEnvironment() {
  const requiredVars = [
    "AUTH_GOOGLE_ID",
    "AUTH_GOOGLE_SECRET",
    "AUTH_FACEBOOK_ID",
    "AUTH_FACEBOOK_SECRET",
    "DATABASE_URL",
    "RESEND_API_KEY",
    "RESEND_FROM_EMAIL",
    "NEXTAUTH_URL",
    "NEXTAUTH_SECRET",
  ];

  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    console.error("🚨 MISSING AUTH ENVIRONMENT VARIABLES:", missing);
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  console.log("✅ All auth environment variables configured");
  return true;
}

// Kör vid startup
if (process.env.NODE_ENV === "production") {
  validateAuthEnvironment();
}
