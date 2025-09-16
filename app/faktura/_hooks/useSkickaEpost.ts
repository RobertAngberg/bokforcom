"use client";
import { useState, useEffect } from "react";
import { useFakturaClient } from "./useFakturaClient";
import { generatePDFAsBase64 } from "../Alternativ/pdfGenerator";
import { ToastState, SkickaEpostProps } from "../_types/types";

export function useSkickaEpost({ onSuccess, onError }: SkickaEpostProps = {}) {
  const { formData } = useFakturaClient();
  const [isSending, setIsSending] = useState(false);
  const [mottagareEmail, setMottagareEmail] = useState("");
  const [egetMeddelande, setEgetMeddelande] = useState("");
  const [toast, setToast] = useState<ToastState>({
    message: "",
    type: "error",
    isVisible: false,
  });

  // Uppdatera mottagarens e-post när kundens e-post ändras
  useEffect(() => {
    if (formData.kundemail && formData.kundemail.trim()) {
      setMottagareEmail(formData.kundemail);
    }
  }, [formData.kundemail]);

  const showToast = (message: string, type: ToastState["type"]) => {
    setToast({
      message,
      type,
      isVisible: true,
    });
  };

  const closeToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  };

  const validateEmail = (email: string): boolean => {
    if (!email.trim()) {
      showToast("Ange mottagarens e-postadress", "error");
      return false;
    }

    if (!email.includes("@")) {
      showToast("Ange en giltig e-postadress", "error");
      return false;
    }

    return true;
  };

  const skickaTestmail = async () => {
    // Validering
    if (!validateEmail(mottagareEmail)) {
      return;
    }

    setIsSending(true);

    try {
      // Generera PDF med den delade funktionen
      const pdfBase64 = await generatePDFAsBase64();

      // Skapa fakturanummer med nollutfyllnad
      const fakturaNr = formData.fakturanummer
        ? formData.fakturanummer.toString().padStart(4, "0")
        : "faktura";

      // Skicka e-post med PDF-bilaga och eget meddelande
      const response = await fetch("/api/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          faktura: {
            ...formData,
            kundemail: mottagareEmail, // Använd det angivna e-postfältet
          },
          pdfAttachment: pdfBase64,
          filename: `Faktura-${fakturaNr}.pdf`,
          customMessage: egetMeddelande.trim(), // Skicka med det egna meddelandet
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Kunde inte skicka e-post");
      }

      showToast("Faktura skickad till kunden!", "success");
      onSuccess?.();
    } catch (error) {
      console.error("❌ E-postfel:", error);
      const errorMessage = error instanceof Error ? error.message : "Okänt fel";
      showToast(`Kunde inte skicka faktura: ${errorMessage}`, "error");
      onError?.(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  const isButtonDisabled = () => {
    return isSending || !formData.fakturanummer || !mottagareEmail.trim() || !formData.id;
  };

  const getButtonText = () => {
    if (isSending) return "📤 Skickar...";
    if (!formData.id) return "❌ Spara faktura först";
    return "📧 Skicka faktura";
  };

  const getStatusMessage = () => {
    if (!formData.id) {
      return {
        type: "warning" as const,
        text: "Spara fakturan först innan du skickar den",
      };
    }

    return {
      type: "info" as const,
      text: `E-posten skickas till ${mottagareEmail || "ingen e-post angiven"}`,
    };
  };

  return {
    // State
    formData,
    isSending,
    mottagareEmail,
    setMottagareEmail,
    egetMeddelande,
    setEgetMeddelande,
    toast,

    // Actions
    skickaTestmail,
    closeToast,

    // Computed values
    isButtonDisabled: isButtonDisabled(),
    buttonText: getButtonText(),
    statusMessage: getStatusMessage(),
    hasCustomerEmail: !!(formData.kundemail && formData.kundemail.trim()),
  };
}
