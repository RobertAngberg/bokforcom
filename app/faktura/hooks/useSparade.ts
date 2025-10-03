"use client";

import { useState, useCallback } from "react";
import { deleteFaktura } from "../actions/fakturaActions";
import { showToast } from "../../_components/Toast";

/**
 * Hook för hantering av sparade fakturor
 */
export function useSparade() {
  // Local state
  const [loadingInvoiceId, setLoadingInvoiceId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteFakturaId, setDeleteFakturaId] = useState<number | null>(null);
  // Store callbacks for delete operation
  const [deleteCallbacks, setDeleteCallbacks] = useState<{
    onSuccess?: () => void;
    onError?: (error: string) => void;
  }>({});

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
      setDeleteFakturaId(fakturaId);
      setDeleteCallbacks({ onSuccess, onError });
      setShowDeleteModal(true);
    },
    [setDeleteFakturaId, setDeleteCallbacks, setShowDeleteModal]
  );

  const confirmDeleteFaktura = useCallback(async () => {
    if (!deleteFakturaId) return;

    const { onSuccess, onError } = deleteCallbacks;

    setShowDeleteModal(false);

    try {
      setLoadingInvoiceId(deleteFakturaId);
      const result = await deleteFaktura(deleteFakturaId);
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
          showToast(errorMsg, "error");
        }
      }
    } catch {
      const errorMsg = "Fel vid borttagning av faktura";
      if (onError) {
        onError(errorMsg);
      } else {
        showToast(errorMsg, "error");
      }
    } finally {
      setLoadingInvoiceId(null);
    }
  }, [deleteFakturaId, deleteCallbacks, setShowDeleteModal, setLoadingInvoiceId]);

  // =============================================================================
  // RETURN OBJECT
  // =============================================================================

  return {
    // State
    loadingInvoiceId,
    showDeleteModal,
    setShowDeleteModal,
    deleteFakturaId,

    // Functions
    handleSelectInvoice,
    handleDeleteInvoice,
    confirmDeleteFaktura,
  };
}
