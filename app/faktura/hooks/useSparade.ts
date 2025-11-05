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
  const [deleteIsOffert, setDeleteIsOffert] = useState(false);
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
    async (
      fakturaId: number,
      isOffert?: boolean,
      onSuccess?: () => void,
      onError?: (error: string) => void
    ) => {
      setDeleteFakturaId(fakturaId);
      setDeleteIsOffert(isOffert || false);
      setDeleteCallbacks({ onSuccess, onError });
      setShowDeleteModal(true);
    },
    [setDeleteFakturaId, setDeleteIsOffert, setDeleteCallbacks, setShowDeleteModal]
  );

  const confirmDeleteFaktura = useCallback(async () => {
    if (!deleteFakturaId) return;

    const { onSuccess, onError } = deleteCallbacks;
    const docType = deleteIsOffert ? "Offert" : "Faktura";

    setShowDeleteModal(false);

    try {
      setLoadingInvoiceId(deleteFakturaId);
      const result = await deleteFaktura(deleteFakturaId);
      if (result.success) {
        if (onSuccess) {
          onSuccess();
        } else {
          // Fallback: Trigga reload event istället för full page reload
          window.dispatchEvent(new Event("reloadFakturor"));
        }
        showToast(`${docType} raderad`, "success");
      } else {
        const errorMsg = result.error || `Fel vid borttagning av ${docType.toLowerCase()}`;
        if (onError) {
          onError(errorMsg);
        } else {
          showToast(errorMsg, "error");
        }
      }
    } catch {
      const errorMsg = `Fel vid borttagning av ${docType.toLowerCase()}`;
      if (onError) {
        onError(errorMsg);
      } else {
        showToast(errorMsg, "error");
      }
    } finally {
      setLoadingInvoiceId(null);
    }
  }, [deleteFakturaId, deleteIsOffert, deleteCallbacks, setShowDeleteModal, setLoadingInvoiceId]);

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
