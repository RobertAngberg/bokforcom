"use client";

import { useState, useCallback, useEffect } from "react";
import { useFakturaClient } from "../context/hooks/FakturaContext";
import { useFakturaLifecycle } from "../context/hooks/FakturaFormContext";
import { sparaNyKund, deleteKund, hamtaSparadeKunder, uppdateraKund } from "../actions/kundActions";
import { validatePersonnummer, validateEmail } from "../../_utils/validationUtils";
import { showToast } from "../../_components/Toast";
import type { FakturaFormData, KundListItem, KundSaveResponse } from "../types/types";

/**
 * Hook för kundhantering (CRUD-operationer)
 */
export function useKundUppgifter() {
  const { formData, kundStatus, setFormData, setKundStatus, resetKund } = useFakturaClient();
  const lifecycle = useFakturaLifecycle();

  // Local state
  const [kunder, setKunder] = useState<Array<KundListItem>>([]);
  const [showDeleteKundModal, setShowDeleteKundModal] = useState(false);

  // Helper functions
  const showSuccess = useCallback((message: string) => {
    showToast(message, "success");
  }, []);

  const showError = useCallback((message: string) => {
    showToast(message, "error");
  }, []);

  const updateFormField = useCallback(
    (field: keyof FakturaFormData, value: string | number | boolean | unknown) => {
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

  // Validera kunddata
  const validateKundData = useCallback(
    (data: Partial<FakturaFormData>): { isValid: boolean; error?: string } => {
      const kundnamn = data.kundnamn || "";
      if (!kundnamn || kundnamn.length < 2) {
        return { isValid: false, error: "Kundnamn krävs (minst 2 tecken)" };
      }

      if (data.kundemail && !validateEmail(data.kundemail)) {
        return { isValid: false, error: "Ogiltig email-adress" };
      }

      if (data.personnummer && !validatePersonnummer(data.personnummer)) {
        return { isValid: false, error: "Ogiltigt personnummer (format: YYMMDD-XXXX)" };
      }

      return { isValid: true };
    },
    []
  );

  // Sanitera kunddata
  const sanitizeKundFormData = useCallback((data: Partial<FakturaFormData>) => {
    return {
      ...data,
      kundnamn: data.kundnamn ?? "",
      kundorganisationsnummer: data.kundorganisationsnummer ?? "",
      kundnummer: data.kundnummer ?? "",
      kundmomsnummer: data.kundmomsnummer ?? "",
      kundadress: data.kundadress ?? "",
      kundpostnummer: data.kundpostnummer ?? "",
      kundstad: data.kundstad ?? "",
      kundemail: data.kundemail ?? "",
      personnummer: data.personnummer ?? "",
    };
  }, []);

  // Spara ny kund
  const sparaNyKundData = useCallback(async (): Promise<KundSaveResponse> => {
    const validation = validateKundData(formData);
    if (!validation.isValid) {
      showError(validation.error!);
      return { success: false, error: validation.error! };
    }

    try {
      const sanitizedData = sanitizeKundFormData(formData);

      // Konvertera till FormData för server action
      const formDataToSend = new FormData();
      formDataToSend.append("kundnamn", sanitizedData.kundnamn || "");
      formDataToSend.append("kundorgnummer", sanitizedData.kundorganisationsnummer || "");
      formDataToSend.append("kundnummer", sanitizedData.kundnummer || "");
      formDataToSend.append("kundmomsnummer", sanitizedData.kundmomsnummer || "");
      formDataToSend.append("kundadress1", sanitizedData.kundadress || "");
      formDataToSend.append("kundpostnummer", sanitizedData.kundpostnummer || "");
      formDataToSend.append("kundstad", sanitizedData.kundstad || "");
      formDataToSend.append("kundemail", sanitizedData.kundemail || "");
      formDataToSend.append("personnummer", sanitizedData.personnummer || "");

      const result = await sparaNyKund(formDataToSend);

      if (result.success) {
        setKundStatus("sparad");
        if ("id" in result && result.id) {
          setFormData({ kundId: result.id.toString() });
        }
        showSuccess("Kund sparad");
      } else {
        showError("error" in result && result.error ? result.error : "Fel vid sparande av kund");
      }

      return result;
    } catch {
      const errorMsg = "Fel vid sparande av kund";
      showError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [
    formData,
    validateKundData,
    sanitizeKundFormData,
    showError,
    showSuccess,
    setKundStatus,
    setFormData,
  ]);

  // Formulärhantering för kunder
  const handleKundChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      const nextValue: string | boolean = value;
      updateFormField(name as keyof FakturaFormData, nextValue);
      if (kundStatus === "loaded") setKundStatus("editing");
    },
    [updateFormField, kundStatus, setKundStatus]
  );

  // Spara kund (förbättrad version)
  const handleKundSave = useCallback(async () => {
    try {
      // Validera kunddata
      const validation = validateKundData(formData);
      if (!validation.isValid) {
        showError(validation.error || "Valideringsfel");
        return;
      }

      // Sanitera data
      const sanitizedData = sanitizeKundFormData(formData);

      const fd = new FormData();
      fd.append("kundnamn", sanitizedData.kundnamn);
      fd.append("kundorgnummer", sanitizedData.kundorganisationsnummer);
      fd.append("kundmomsnummer", sanitizedData.kundmomsnummer);
      fd.append("kundadress1", sanitizedData.kundadress);
      fd.append("kundpostnummer", sanitizedData.kundpostnummer);
      fd.append("kundstad", sanitizedData.kundstad);
      fd.append("kundemail", sanitizedData.kundemail);
      fd.append("personnummer", sanitizedData.personnummer);

      const res: KundSaveResponse = formData.kundId
        ? await uppdateraKund(parseInt(formData.kundId, 10), fd)
        : await sparaNyKund(fd);

      if (res.success) {
        if (!formData.kundId && res.id) {
          updateFormField("kundId", res.id.toString());
        }
        setKundStatus("loaded");
        showToast("Kund sparad!", "success");

        // Ladda om kunder
        const sparade = await hamtaSparadeKunder();
        setKunder(sparade.sort((a, b) => a.kundnamn.localeCompare(b.kundnamn)));
      } else {
        showError("Kunde inte spara kund");
      }
    } catch {
      showError("Kunde inte spara kund");
    }
  }, [formData, updateFormField, setKundStatus, validateKundData, sanitizeKundFormData, showError]);

  // Välj kund
  const handleSelectCustomer = useCallback(
    (kundId: string) => {
      const valdKund = kunder.find((k) => k.id.toString() === kundId);
      if (!valdKund) return;

      updateMultipleFields({
        kundId: valdKund.id.toString(),
        kundnamn: valdKund.kundnamn,
        kundorganisationsnummer: valdKund.kundorgnummer ?? "",
        kundnummer: valdKund.kundnummer ?? "",
        kundmomsnummer: valdKund.kundmomsnummer ?? "",
        kundadress: valdKund.kundadress1 ?? "",
        kundpostnummer: valdKund.kundpostnummer ?? "",
        kundstad: valdKund.kundstad ?? "",
        kundemail: valdKund.kundemail || "",
        personnummer: valdKund.personnummer || "",
      });
      setKundStatus("loaded");
    },
    [kunder, updateMultipleFields, setKundStatus]
  );

  // Skapa ny kund
  const handleCreateNewCustomer = useCallback(() => {
    resetKund();
    setKundStatus("editing");
  }, [resetKund, setKundStatus]);

  // Radera kund
  const handleDeleteCustomer = useCallback(async () => {
    if (!formData.kundId) return;
    setShowDeleteKundModal(true);
  }, [formData.kundId]);

  const confirmDeleteKund = useCallback(async () => {
    if (!formData.kundId) return;

    setShowDeleteKundModal(false);

    try {
      await deleteKund(parseInt(formData.kundId, 10));
      resetKund();
      setKundStatus("none");
      const sparade = await hamtaSparadeKunder();
      setKunder(sparade.sort((a, b) => a.kundnamn.localeCompare(b.kundnamn)));
      showSuccess("Kund raderad");
    } catch (error) {
      console.error("Fel vid radering av kund:", error);
      showError("Kunde inte radera kunden");
    }
  }, [formData.kundId, resetKund, setKundStatus, showSuccess, showError]);

  // Sätt till redigeringsläge
  const handleEditCustomer = useCallback(() => {
    setKundStatus("editing");
  }, [setKundStatus]);

  // Hämta sparade kunder vid mount
  useEffect(() => {
    if (lifecycle.current.harLastatKunder) {
      return;
    }

    lifecycle.current.harLastatKunder = true;

    const laddaKunder = async () => {
      try {
        const sparade = await hamtaSparadeKunder();
        setKunder(sparade.sort((a, b) => a.kundnamn.localeCompare(b.kundnamn)));
      } catch (error) {
        console.log("Fel vid hämtning av kunder", error);
        lifecycle.current.harLastatKunder = false;
      }
    };

    laddaKunder();
  }, [lifecycle]);

  return {
    // State
    kunder,
    showDeleteKundModal,
    setShowDeleteKundModal,

    // Validation functions
    validateKundData,
    sanitizeKundFormData,

    // CRUD functions
    sparaNyKundData,
    handleKundChange,
    handleKundSave,
    handleSelectCustomer,
    handleCreateNewCustomer,
    handleDeleteCustomer,
    confirmDeleteKund,
    handleEditCustomer,
  };
}
