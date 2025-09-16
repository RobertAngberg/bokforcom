"use client";

import { useState, useCallback, useEffect } from "react";
import { useFakturaStore } from "../_stores/fakturaStore";
import type { FakturaFormData, NyArtikel, KundStatus, ServerData } from "../_types/types";

export function useFakturaClient() {
  // Zustand store hooks
  const formData = useFakturaStore((state) => state.formData);
  const kundStatus = useFakturaStore((state) => state.kundStatus);
  const nyArtikel = useFakturaStore((state) => state.nyArtikel);
  const produkterTjansterState = useFakturaStore((state) => state.produkterTjansterState);
  const setFormData = useFakturaStore((state) => state.setFormData);
  const resetFormData = useFakturaStore((state) => state.resetFormData);
  const setKundStatus = useFakturaStore((state) => state.setKundStatus);
  const resetKund = useFakturaStore((state) => state.resetKund);
  const setNyArtikel = useFakturaStore((state) => state.setNyArtikel);
  const resetNyArtikel = useFakturaStore((state) => state.resetNyArtikel);
  const setProdukterTjansterState = useFakturaStore((state) => state.setProdukterTjansterState);
  const resetProdukterTjanster = useFakturaStore((state) => state.resetProdukterTjanster);

  // Local UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Helper functions
  const updateFormField = useCallback(
    (field: keyof FakturaFormData, value: any) => {
      setFormData({ [field]: value });
    },
    [setFormData]
  );

  const updateMultipleFields = useCallback(
    (updates: Partial<FakturaFormData>) => {
      setFormData(updates);
    },
    [setFormData]
  );

  const updateArtikel = useCallback(
    (updates: Partial<NyArtikel>) => {
      setNyArtikel(updates);
    },
    [setNyArtikel]
  );

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
  }, []);

  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
    setError(null);
    setTimeout(() => setSuccessMessage(null), 3000);
  }, []);

  const showError = useCallback((message: string) => {
    setError(message);
    setSuccessMessage(null);
  }, []);

  // Convenience functions for common operations
  const clearKund = useCallback(() => {
    resetKund();
    setKundStatus("none");
  }, [resetKund, setKundStatus]);

  const loadKund = useCallback(
    (kundData: Partial<FakturaFormData>) => {
      setFormData(kundData);
      setKundStatus("loaded");
    },
    [setFormData, setKundStatus]
  );

  const startEditingKund = useCallback(() => {
    setKundStatus("editing");
  }, [setKundStatus]);

  const addArtikel = useCallback(() => {
    if (!nyArtikel.beskrivning || !nyArtikel.antal || !nyArtikel.prisPerEnhet) {
      showError("Alla fält måste fyllas i");
      return false;
    }

    const artikel = {
      beskrivning: nyArtikel.beskrivning,
      antal: parseFloat(nyArtikel.antal),
      prisPerEnhet: parseFloat(nyArtikel.prisPerEnhet),
      moms: parseFloat(nyArtikel.moms),
      valuta: nyArtikel.valuta,
      typ: nyArtikel.typ as "tjänst" | "vara",
    };

    setFormData({
      artiklar: [...formData.artiklar, artikel],
    });

    resetNyArtikel();
    return true;
  }, [nyArtikel, formData.artiklar, setFormData, resetNyArtikel, showError]);

  const removeArtikel = useCallback(
    (index: number) => {
      const newArtiklar = formData.artiklar.filter((_, i) => i !== index);
      setFormData({ artiklar: newArtiklar });
    },
    [formData.artiklar, setFormData]
  );

  const calculateTotal = useCallback(() => {
    return formData.artiklar.reduce((total, artikel) => {
      const subtotal = artikel.antal * artikel.prisPerEnhet;
      const moms = subtotal * (artikel.moms / 100);
      return total + subtotal + moms;
    }, 0);
  }, [formData.artiklar]);

  const calculateSubtotal = useCallback(() => {
    return formData.artiklar.reduce((total, artikel) => {
      return total + artikel.antal * artikel.prisPerEnhet;
    }, 0);
  }, [formData.artiklar]);

  const calculateMoms = useCallback(() => {
    return formData.artiklar.reduce((total, artikel) => {
      const subtotal = artikel.antal * artikel.prisPerEnhet;
      return total + subtotal * (artikel.moms / 100);
    }, 0);
  }, [formData.artiklar]);

  // Preview functions
  const openPreview = useCallback(() => {
    setShowPreview(true);
  }, []);

  const closePreview = useCallback(() => {
    setShowPreview(false);
  }, []);

  // Init functions
  const initializeForNewFaktura = useCallback(() => {
    setFormData({
      id: "",
      fakturanummer: "",
      fakturadatum: "",
      forfallodatum: "",
      kundnamn: "",
      kundId: "",
      kundnummer: "",
      kundorganisationsnummer: "",
      kundadress: "",
      kundpostnummer: "",
      kundstad: "",
      kundemail: "",
      artiklar: [],
    });
  }, [setFormData]);

  const loadForetagsprofil = useCallback(
    (profil: any) => {
      if (!profil || formData.företagsnamn) return;

      setFormData({
        företagsnamn: profil.företagsnamn ?? "",
        adress: profil.adress ?? "",
        postnummer: profil.postnummer ?? "",
        stad: profil.stad ?? "",
        organisationsnummer: profil.organisationsnummer ?? "",
        momsregistreringsnummer: profil.momsregistreringsnummer ?? "",
        telefonnummer: profil.telefonnummer ?? "",
        epost: profil.epost ?? "",
        bankinfo: profil.bankinfo ?? "",
        webbplats: profil.webbplats ?? "",
      });
    },
    [formData.företagsnamn, setFormData]
  );

  // Reload function
  const reloadFaktura = useCallback(() => {
    if (confirm("🔄 Vill du verkligen återställa? All ifylld data försvinner.")) {
      window.location.reload();
    }
  }, []);

  return {
    // State
    formData,
    kundStatus,
    nyArtikel,
    produkterTjansterState,
    isLoading,
    error,
    successMessage,
    showPreview,

    // Basic actions
    setFormData,
    resetFormData,
    setKundStatus,
    resetKund,
    setNyArtikel,
    resetNyArtikel,
    setProdukterTjansterState,
    resetProdukterTjanster,

    // Helper functions
    updateFormField,
    updateMultipleFields,
    updateArtikel,
    clearMessages,
    showSuccess,
    showError,

    // Convenience functions
    clearKund,
    loadKund,
    startEditingKund,
    addArtikel,
    removeArtikel,

    // Calculations
    calculateTotal,
    calculateSubtotal,
    calculateMoms,

    // Preview functions
    openPreview,
    closePreview,

    // Init functions
    initializeForNewFaktura,
    loadForetagsprofil,
    reloadFaktura,

    // UI helpers
    setIsLoading,
  };
}

// Specialiserad hook för NyFaktura som hanterar auto-initialisering
export function useNyFaktura(initialData: ServerData) {
  const fakturaClient = useFakturaClient();

  // Auto-initialisera när hook mountas
  useEffect(() => {
    fakturaClient.loadForetagsprofil(initialData.foretagsprofil);
  }, [initialData.foretagsprofil, fakturaClient.loadForetagsprofil]);

  useEffect(() => {
    fakturaClient.initializeForNewFaktura();
  }, [fakturaClient.initializeForNewFaktura]);

  return fakturaClient;
}
