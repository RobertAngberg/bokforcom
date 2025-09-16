"use client";

import { useState } from "react";
import { useFakturaClient } from "./useFakturaClient";
import { registreraKundfakturaBetalning, deleteFaktura } from "../actions";
import { Artikel, ToastType, ToastState, BetalningsModal } from "../_types/types";

// Business logic utility functions
// Beräkna totalbelopp för faktura
function calculateInvoiceTotalBelopp(artiklar: Artikel[]): number {
  const totalBelopp = artiklar.reduce((sum, artikel) => {
    const prisInkMoms = artikel.prisPerEnhet * (1 + artikel.moms / 100);
    return sum + artikel.antal * prisInkMoms;
  }, 0);
  return Math.round(totalBelopp * 100) / 100; // Avrunda till 2 decimaler
}

// Identifiera ROT/RUT typ från artiklar
function determineRotRutType(artiklar: Artikel[]): string | null {
  const rotRutArtiklar = artiklar.filter((artikel) => artikel.rotRutTyp);
  const harROT = rotRutArtiklar.some((artikel) => artikel.rotRutTyp === "ROT");
  const harRUT = rotRutArtiklar.some((artikel) => artikel.rotRutTyp === "RUT");

  if (harROT && harRUT) {
    return "ROT+RUT";
  } else if (harROT) {
    return "ROT";
  } else if (harRUT) {
    return "RUT";
  }
  return null;
}

// Beräkna ROT/RUT avdrag
function calculateRotRutAvdrag(artiklar: Artikel[]): number {
  return artiklar
    .filter((a) => a.rotRutTyp)
    .reduce((sum, a) => {
      const arbetskostnad = parseFloat(a.arbetskostnadExMoms?.toString() || "0") || 0;
      const procent = parseFloat(a.avdragProcent?.toString() || "0") || 0;
      return sum + (arbetskostnad * procent) / 100;
    }, 0);
}

// Förbättra fakturadata med beräknade värden
function enrichFakturaData(faktura: any, artiklar: Artikel[]) {
  const totalBelopp = calculateInvoiceTotalBelopp(artiklar);
  const rotRutTyp = determineRotRutType(artiklar);

  return {
    ...faktura,
    totalBelopp,
    antalArtiklar: artiklar.length,
    rotRutTyp,
  };
}

export function useSparadeFakturor(onSelectInvoice?: (id: number) => void | Promise<void>) {
  // Zustand store access
  const { setFormData, setKundStatus } = useFakturaClient();

  // Local UI state - sparad fakturor specific
  const [loadingInvoiceId, setLoadingInvoiceId] = useState<number | null>(null);
  const [betalningsModal, setBetalningsModal] = useState<BetalningsModal | null>(null);
  const [toast, setToast] = useState<ToastState>({
    message: "",
    type: "error",
    isVisible: false,
  });

  // Business logic functions
  const registreraBetalning = async (fakturaId: number, belopp: number, kontoklass: string) => {
    try {
      const result = await registreraKundfakturaBetalning(fakturaId, belopp, kontoklass);
      if (result.success) {
        setToast({
          message: "Betalning registrerad!",
          type: "success",
          isVisible: true,
        });
        window.dispatchEvent(new Event("reloadFakturor"));
        setBetalningsModal(null);
      } else {
        setToast({
          message: result.error || "Kunde inte registrera betalning",
          type: "error",
          isVisible: true,
        });
      }
    } catch (error) {
      console.error("Fel vid betalningsregistrering:", error);
      setToast({
        message: "Fel vid registrering av betalning",
        type: "error",
        isVisible: true,
      });
    }
  };

  // Handle invoice selection with prop delegation
  const handleSelectInvoice = async (id: number) => {
    if (typeof onSelectInvoice === "function") {
      setLoadingInvoiceId(id);
      try {
        await onSelectInvoice(id);
        setKundStatus("loaded");
      } catch (error) {
        setToast({
          message: "Fel vid laddning av faktura",
          type: "error",
          isVisible: true,
        });
        console.error(error);
      } finally {
        setLoadingInvoiceId(null);
      }
      return;
    }

    // Fallback: ingen onSelectInvoice prop given, visa meddelande
    setToast({
      message: "Ingen hanterare för fakturaval",
      type: "error",
      isVisible: true,
    });
  };

  // Handle invoice deletion
  const handleDeleteInvoice = async (id: number) => {
    if (!confirm("❌ Vill du ta bort fakturan?")) return;

    try {
      await deleteFaktura(id);
      // Trigga reload event så Fakturor.tsx uppdaterar sin lista
      window.dispatchEvent(new Event("reloadFakturor"));
    } catch {
      setToast({
        message: "Kunde inte ta bort faktura",
        type: "error",
        isVisible: true,
      });
    }
  };

  return {
    // UI State
    loadingInvoiceId,
    betalningsModal,
    toast,

    // Zustand store access
    setFormData,
    setKundStatus,

    // State setters for now (later these will become actions)
    setLoadingInvoiceId,
    setBetalningsModal,
    setToast,

    // Business logic
    registreraBetalning,
    handleSelectInvoice,
    handleDeleteInvoice,

    // Utility functions
    calculateInvoiceTotalBelopp,
    determineRotRutType,
    calculateRotRutAvdrag,
    enrichFakturaData,
  };
}
