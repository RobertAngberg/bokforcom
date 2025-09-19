"use client";

import { useFaktura } from "./useFaktura";
import { useCallback } from "react";
import type { NyFakturaClientProps } from "../_types/types";

/**
 * Legacy alias för useFaktura
 * Används för bakåtkompatibilitet under migrationen från Zustand till Context
 */
export function useFakturaClient() {
  return useFaktura();
}

/**
 * Specifik hook för NyFaktura-komponenten
 * Tillhandahåller preview-funktionalitet och reload-funktioner
 */
export function useNyFaktura(initialData?: NyFakturaClientProps["initialData"]) {
  const { formData, showPreview, setShowPreview, initStore, ...rest } = useFaktura();

  const closePreview = useCallback(() => {
    setShowPreview(false);
  }, [setShowPreview]);

  const openPreview = useCallback(() => {
    setShowPreview(true);
  }, [setShowPreview]);

  const reloadFaktura = useCallback(() => {
    if (initialData) {
      initStore(initialData);
    }
  }, [initialData, initStore]);

  return {
    formData,
    showPreview,
    closePreview,
    openPreview,
    reloadFaktura,
    ...rest,
  };
}

// Default export för backward compatibility
export default useFakturaClient;
