"use client";

import { useState, useCallback } from "react";
import { deleteFaktura } from "../actions/fakturaActions";

/**
 * Hook för hantering av sparade fakturor
 */
export function useSparade() {
  // Local state
  const [loadingInvoiceId, setLoadingInvoiceId] = useState<number | null>(null);

  // =============================================================================
  // SPARADE FAKTUROR FUNCTIONS
  // =============================================================================

  const handleSelectInvoice = useCallback((fakturaId: number, onSelect?: (id: number) => void) => {
    if (onSelect) {
      onSelect(fakturaId);
    }
  }, []);

  const handleDeleteInvoice = useCallback(
    async (fakturaId: number, onSuccess?: () => void, onError?: (error: string) => void) => {
      if (!confirm("Är du säker på att du vill ta bort denna faktura?")) {
        return;
      }

      try {
        setLoadingInvoiceId(fakturaId);
        const result = await deleteFaktura(fakturaId);
        if (result.success) {
          if (onSuccess) {
            onSuccess();
          } else {
            // Fallback för när ingen callback ges
            window.location.reload();
          }
        } else {
          const errorMsg = result.error || "Fel vid borttagning av faktura";
          if (onError) {
            onError(errorMsg);
          } else {
            alert(errorMsg);
          }
        }
      } catch (error) {
        const errorMsg = "Fel vid borttagning av faktura";
        if (onError) {
          onError(errorMsg);
        } else {
          alert(errorMsg);
        }
      } finally {
        setLoadingInvoiceId(null);
      }
    },
    []
  );

  // =============================================================================
  // RETURN OBJECT
  // =============================================================================

  return {
    // State
    loadingInvoiceId,

    // Functions
    handleSelectInvoice,
    handleDeleteInvoice,
  };
}
