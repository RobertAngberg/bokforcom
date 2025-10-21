import { useState, useCallback } from "react";
import { RememberMePreference } from "../types/types";

// LocalStorage nycklar
const REMEMBER_ME_KEY = "auth_remember_me";

/**
 * Sparar remember me-preferensen i localStorage
 */
export function saveRememberMePreference(enabled: boolean): void {
  try {
    const preference: RememberMePreference = {
      enabled,
      timestamp: Date.now(),
    };
    localStorage.setItem(REMEMBER_ME_KEY, JSON.stringify(preference));
  } catch (error) {
    console.warn("Kunde inte spara remember me-preferens:", error);
  }
}

/**
 * Hämtar remember me-preferensen från localStorage
 */
export function getRememberMePreference(): boolean {
  try {
    const stored = localStorage.getItem(REMEMBER_ME_KEY);
    if (!stored) return false;

    const preference: RememberMePreference = JSON.parse(stored);

    // Kontrollera om preferensen är för gammal (mer än 30 dagar)
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 dagar i ms
    const isExpired = Date.now() - preference.timestamp > maxAge;

    if (isExpired) {
      localStorage.removeItem(REMEMBER_ME_KEY);
      return false;
    }

    return preference.enabled;
  } catch (error) {
    console.warn("Kunde inte läsa remember me-preferens:", error);
    return false;
  }
}

/**
 * Rensar remember me-preferensen
 */
export function clearRememberMePreference(): void {
  try {
    localStorage.removeItem(REMEMBER_ME_KEY);
  } catch (error) {
    console.warn("Kunde inte rensa remember me-preferens:", error);
  }
}

/**
 * Hook för att hantera remember me-state
 */
export function useRememberMe() {
  // Ladda preferens direkt vid initialisering istället för i useEffect
  const [rememberMe, setRememberMe] = useState(() => {
    // Använd lazy initialization för att undvika SSR-problem
    if (typeof window === "undefined") return false;
    return getRememberMePreference();
  });

  // Uppdatera preferens när state ändras
  const updateRememberMe = useCallback((enabled: boolean) => {
    setRememberMe(enabled);
    saveRememberMePreference(enabled);
  }, []);

  return {
    rememberMe,
    setRememberMe: updateRememberMe,
  };
}

/**
 * Client-side logout som rensar remember me-preferensen
 */
export async function logoutAndClearRememberMe() {
  // Rensa remember me-preferensen
  clearRememberMePreference();

  // Logga ut med Better Auth
  const { signOut } = await import("../../../../_lib/auth-client");
  await signOut({
    fetchOptions: {
      onSuccess: () => {
        window.location.href = "/login";
      },
    },
  });
}
