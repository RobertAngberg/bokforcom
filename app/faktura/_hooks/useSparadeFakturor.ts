import { useState } from "react";
import { deleteFaktura } from "../actions";
import { useFakturaClient } from "./useFakturaClient";

export function useSparadeFakturor(onSelectInvoice?: (fakturaId: number) => void) {
  const { showSuccess, showError } = useFakturaClient();
  const [loadingInvoiceId, setLoadingInvoiceId] = useState<number | null>(null);

  const handleSelectInvoice = (fakturaId: number) => {
    if (onSelectInvoice) {
      onSelectInvoice(fakturaId);
    }
  };

  const handleDeleteInvoice = async (fakturaId: number) => {
    if (!confirm("Är du säker på att du vill ta bort denna faktura?")) {
      return;
    }

    try {
      setLoadingInvoiceId(fakturaId);
      const result = await deleteFaktura(fakturaId);
      if (result.success) {
        showSuccess("Faktura borttagen");
        window.location.reload();
      } else {
        showError(result.error || "Fel vid borttagning av faktura");
      }
    } catch (error) {
      showError("Fel vid borttagning av faktura");
    } finally {
      setLoadingInvoiceId(null);
    }
  };

  return {
    loadingInvoiceId,
    handleSelectInvoice,
    handleDeleteInvoice,
  };
}
