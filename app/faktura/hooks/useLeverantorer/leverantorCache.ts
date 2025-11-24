"use client";

/**
 * leverantorCache.ts
 *
 * Cache-hantering och validering för leverantörer:
 * - Centraliserad cache med Promise-deduplicering
 * - Validering av leverantörsdata
 * - Data-mappning för formulär
 * - Global cache invalidation
 */

import { getLeverantorer } from "../../actions/leverantorActions";
import { validateEmail } from "../../../_utils/validationUtils";
import { Leverantör, LeverantörFormData } from "../../types/types";

// =============================================================================
// VALIDERING
// =============================================================================

function validateLeverantörEmail(email: string): boolean {
  if (!email) return true; // Email är valfritt
  return validateEmail(email);
}

export function validateLeverantörData(formData: LeverantörFormData): {
  isValid: boolean;
  error?: string;
} {
  const namn = formData.namn || "";
  if (!namn || namn.length < 2) {
    return { isValid: false, error: "Leverantörsnamn krävs (minst 2 tecken)" };
  }

  if (formData.epost && !validateLeverantörEmail(formData.epost)) {
    return { isValid: false, error: "Ogiltig email-adress" };
  }

  return { isValid: true };
}

export function mapLeverantorFormData(formData: LeverantörFormData): LeverantörFormData {
  return {
    ...formData,
    namn: formData.namn ?? "",
    organisationsnummer: formData.organisationsnummer ?? "",
    adress: formData.adress ?? "",
    postnummer: formData.postnummer ?? "",
    stad: formData.stad ?? "",
    telefon: formData.telefon ?? "",
  };
}

// =============================================================================
// CACHE-HANTERING
// =============================================================================

let leverantorerCache: Leverantör[] | null = null;
let leverantorerPromise: Promise<Leverantör[] | null> | null = null;
export let leverantorerErrorCache: string | null = null;

export async function ensureLeverantorer(force = false): Promise<Leverantör[] | null> {
  if (!force) {
    if (leverantorerCache) {
      return leverantorerCache;
    }
    if (leverantorerPromise) {
      return leverantorerPromise;
    }
  }

  if (force) {
    resetLeverantorerCache();
  }

  const fetchPromise = (async () => {
    try {
      const apiResult = await getLeverantorer();

      if (!apiResult.success) {
        throw new Error("API returned success: false");
      }

      leverantorerCache = apiResult.leverantörer || [];
      leverantorerErrorCache = null;
      return leverantorerCache;
    } catch (error) {
      leverantorerCache = [];
      leverantorerErrorCache = "Kunde inte ladda leverantörer";
      throw error;
    } finally {
      leverantorerPromise = null;
    }
  })();

  leverantorerPromise = fetchPromise;
  return fetchPromise;
}

export function resetLeverantorerCache() {
  leverantorerCache = null;
  leverantorerErrorCache = null;
}

export function getLeverantorerCache() {
  return leverantorerCache;
}

// =============================================================================
// GLOBAL CACHE INVALIDATION
// =============================================================================

import { resetBokfordaCache } from "./useBokfordaFakturor";
import { resetSparadeFakturorPageCache } from "./useSparadeFakturor";

/**
 * Rensar alla caches för leverantörsfakturor
 * Används när data uppdateras och caches behöver invalideras
 */
export function invalidateLeverantorsfakturaCaches() {
  resetLeverantorerCache();
  resetBokfordaCache();
  resetSparadeFakturorPageCache();
}
