"use client";

import { useState, useCallback, useEffect } from "react";
import { useFaktura } from "./useFaktura";
import { generatePDFAsBase64 } from "../utils/pdfGenerator";
import { showToast } from "../../_components/Toast";
import { validateEmail } from "../../_utils/validationUtils";

// Types
import type { SkickaEpostProps } from "../types/types";

/**
 * Hook för e-post funktionalitet - skicka fakturor via e-post
 */
export function useSkickaEpost() {
  // Get form data from main faktura hook
  const { formData } = useFaktura();

  // Local state för e-post
  const [isSending, setIsSending] = useState(false);
  const [mottagareEmail, setMottagareEmail] = useState("");
  const [egetMeddelande, setEgetMeddelande] = useState("");

  // Förifyll med kundens e-post när formData ändras (endast första gången)
  useEffect(() => {
    if (formData.kundemail && !mottagareEmail) {
      setMottagareEmail(formData.kundemail);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.kundemail]);

  // =============================================================================
  // EMAIL FUNCTIONS
  // =============================================================================

  // Validera e-postadress
  const validateEmailAddress = useCallback((email: string): boolean => {
    if (!email.trim()) {
      showToast("Ange mottagarens e-postadress", "error");
      return false;
    }

    if (!validateEmail(email)) {
      showToast("Ange en giltig e-postadress", "error");
      return false;
    }

    return true;
  }, []);

  // Skicka e-post
  const skickaEpost = useCallback(
    async (customProps?: Partial<SkickaEpostProps>) => {
      // Validering
      const trimmedEmail = mottagareEmail.trim();
      if (!validateEmailAddress(trimmedEmail)) {
        return;
      }

      if (!formData.id) {
        showToast("Spara fakturan först innan du skickar den", "error");
        return;
      }

      setIsSending(true);

      try {
        // Generera PDF som base64
        const pdfBase64 = await generatePDFAsBase64();

        const safeFilename = formData.fakturanummer?.trim()
          ? `faktura-${formData.fakturanummer.trim()}.pdf`
          : "faktura.pdf";

        const payload = {
          faktura: {
            ...formData,
            kundemail: trimmedEmail, // Använd det angivna e-postfältet
          },
          pdfAttachment: pdfBase64,
          filename: safeFilename,
          customMessage: egetMeddelande.trim(), // Skicka med det egna meddelandet
        };

        const response = await fetch("/api/email/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Kunde inte skicka e-post");
        }

        showToast("Faktura skickad till kunden!", "success");
        customProps?.onSuccess?.();
      } catch (error) {
        console.error("❌ E-postfel:", error);
        const errorMessage = error instanceof Error ? error.message : "Okänt fel";
        showToast(`Kunde inte skicka faktura: ${errorMessage}`, "error");
        customProps?.onError?.(errorMessage);
      } finally {
        setIsSending(false);
      }
    },
    [mottagareEmail, egetMeddelande, formData, validateEmailAddress]
  );

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================

  const isEpostButtonDisabled = useCallback(() => {
    return isSending || !formData.fakturanummer || !mottagareEmail.trim() || !formData.id;
  }, [isSending, formData.fakturanummer, mottagareEmail, formData.id]);

  const epostButtonText = isSending ? "Skickar..." : "📧 Skicka e-post";

  const hasCustomerEmail = formData.kundemail === mottagareEmail && mottagareEmail.trim() !== "";

  const epostStatusMessage = {
    type: !mottagareEmail.trim() ? "warning" : "info",
    text: !mottagareEmail.trim() ? "Ingen e-postadress angiven" : `Skickas till ${mottagareEmail}`,
  };

  // =============================================================================
  // RETURN
  // =============================================================================

  return {
    // State
    isSending,
    mottagareEmail,
    egetMeddelande,

    // Setters
    setMottagareEmail,
    setEgetMeddelande,

    // Actions
    skickaEpost,

    // Computed
    isEpostButtonDisabled: isEpostButtonDisabled(),
    epostButtonText,
    epostStatusMessage,
    hasCustomerEmail,
  };
}
