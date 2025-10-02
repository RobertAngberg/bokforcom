/**
 * Login module types and interfaces
 * Centraliserad typfil för hela login-mappen
 */

// ============================================================================
// Session & Authentication Types
// ============================================================================

/**
 * RememberMe preference som sparas i localStorage
 */
export interface RememberMePreference {
  enabled: boolean;
  timestamp: number;
}

/**
 * Session duration constants
 */
export const SESSION_DURATIONS = {
  SHORT: 24 * 60 * 60, // 24 timmar
  LONG: 30 * 24 * 60 * 60, // 30 dagar
} as const;

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Resultat från validering (email, lösenord, orgnr etc.)
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Security configuration för Better Auth
 */
export interface AuthSecurityConfig {
  hasSecureSession: boolean;
  hasSecureCallbacks: boolean;
  hasSecureProviders: boolean;
  hasSecureAdapter: boolean;
  securityScore: number;
}

// ============================================================================
// Component Props
// ============================================================================

/**
 * Props för ResetPassword-komponenten
 */
export interface ResetPasswordProps {
  token: string;
  onSuccess: () => void;
}

/**
 * Props för ForgotPassword-komponenten
 */
export interface ForgotPasswordProps {
  onBackToLogin: () => void;
}
