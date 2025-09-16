"use client";

import { useState, useEffect, useCallback } from "react";
import { sparaNyKund, deleteKund, hämtaSparadeKunder, uppdateraKund } from "../actions";
import { useFakturaClient } from "./useFakturaClient";
import { sanitizeFormInput, validatePersonnummer } from "../../_utils/validationUtils";
import { validateEmail } from "../../login/sakerhet/loginValidation";
import type { ToastState, KundSaveResponse } from "../_types/types";

// Validera komplett kunddata
function validateKundData(formData: any): { isValid: boolean; error?: string } {
  const kundnamn = sanitizeFormInput(formData.kundnamn || "");
  if (!kundnamn || kundnamn.length < 2) {
    return { isValid: false, error: "Kundnamn krävs (minst 2 tecken)" };
  }

  if (formData.kundemail && !validateEmail(formData.kundemail)) {
    return { isValid: false, error: "Ogiltig email-adress" };
  }

  if (formData.personnummer && !validatePersonnummer(formData.personnummer)) {
    return { isValid: false, error: "Ogiltigt personnummer (format: YYMMDD-XXXX)" };
  }

  return { isValid: true };
}

// Sanitera all kunddata innan spara
function sanitizeKundFormData(formData: any) {
  return {
    ...formData,
    kundnamn: sanitizeFormInput(formData.kundnamn || ""),
    kundorganisationsnummer: sanitizeFormInput(formData.kundorganisationsnummer || ""),
    kundnummer: sanitizeFormInput(formData.kundnummer || ""),
    kundmomsnummer: sanitizeFormInput(formData.kundmomsnummer || ""),
    kundadress: sanitizeFormInput(formData.kundadress || ""),
    kundpostnummer: sanitizeFormInput(formData.kundpostnummer || ""),
    kundstad: sanitizeFormInput(formData.kundstad || ""),
    personnummer: sanitizeFormInput(formData.personnummer || ""),
  };
}

export function useKundUppgifter() {
  const { formData, updateFormField, updateMultipleFields, kundStatus, setKundStatus, resetKund } =
    useFakturaClient();

  // Local state
  const [kunder, setKunder] = useState<any[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    message: "",
    type: "error",
    isVisible: false,
  });

  // Hämta sparade kunder vid mount
  useEffect(() => {
    const laddaKunder = async () => {
      try {
        const sparade = await hämtaSparadeKunder();
        setKunder(sparade.sort((a: any, b: any) => a.kundnamn.localeCompare(b.kundnamn)));
      } catch (error) {
        console.log("Fel vid hämtning av kunder");
      }
    };
    laddaKunder();
  }, []);

  // Formulärhantering
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      updateFormField(name as any, value);
      if (kundStatus === "loaded") setKundStatus("editing");
    },
    [updateFormField, kundStatus, setKundStatus]
  );

  // Spara kund
  const handleSave = useCallback(async () => {
    try {
      // Validera kunddata
      const validation = validateKundData(formData);
      if (!validation.isValid) {
        setToast({
          message: validation.error || "Valideringsfel",
          type: "error",
          isVisible: true,
        });
        return;
      }

      // Sanitera data
      const sanitizedData = sanitizeKundFormData(formData);

      const fd = new FormData();
      fd.append("kundnamn", sanitizedData.kundnamn);
      fd.append("kundorgnummer", sanitizedData.kundorganisationsnummer);
      fd.append("kundnummer", sanitizedData.kundnummer);
      fd.append("kundmomsnummer", sanitizedData.kundmomsnummer);
      fd.append("kundadress1", sanitizedData.kundadress);
      fd.append("kundpostnummer", sanitizedData.kundpostnummer);
      fd.append("kundstad", sanitizedData.kundstad);
      fd.append("kundemail", formData.kundemail);
      fd.append("personnummer", sanitizedData.personnummer);

      const res: KundSaveResponse = formData.kundId
        ? await uppdateraKund(parseInt(formData.kundId, 10), fd)
        : await sparaNyKund(fd);

      if (res.success) {
        if (!formData.kundId && res.id) {
          updateFormField("kundId", res.id.toString());
        }
        setKundStatus("loaded");
        setShowSuccess(true);
        setFadeOut(false);
        setTimeout(() => setFadeOut(true), 1500);
        setTimeout(() => setShowSuccess(false), 3000);

        // Ladda om kunder
        const sparade = await hämtaSparadeKunder();
        setKunder(sparade.sort((a: any, b: any) => a.kundnamn.localeCompare(b.kundnamn)));
      } else {
        setToast({
          message: "Kunde inte spara kund",
          type: "error",
          isVisible: true,
        });
      }
    } catch (error) {
      setToast({
        message: "Kunde inte spara kund",
        type: "error",
        isVisible: true,
      });
    }
  }, [formData, updateFormField, setKundStatus]);

  // Välj kund
  const handleSelectCustomer = useCallback(
    (kundId: string) => {
      const valdKund = kunder.find((k) => k.id.toString() === kundId);
      if (!valdKund) return;

      updateMultipleFields({
        kundId: valdKund.id.toString(),
        kundnamn: valdKund.kundnamn,
        kundorganisationsnummer: valdKund.kundorgnummer,
        kundnummer: valdKund.kundnummer,
        kundmomsnummer: valdKund.kundmomsnummer,
        kundadress: valdKund.kundadress1,
        kundpostnummer: valdKund.kundpostnummer,
        kundstad: valdKund.kundstad,
        kundemail: valdKund.kundemail,
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
    if (!confirm("Är du säker på att du vill ta bort kunden?")) return;

    try {
      await deleteKund(parseInt(formData.kundId, 10));
      resetKund();
      setKundStatus("none");
      const sparade = await hämtaSparadeKunder();
      setKunder(sparade.sort((a: any, b: any) => a.kundnamn.localeCompare(b.kundnamn)));
      setToast({
        message: "Kund raderad",
        type: "success",
        isVisible: true,
      });
    } catch (error) {
      console.error("Fel vid radering av kund:", error);
      setToast({
        message: "Kunde inte radera kunden",
        type: "error",
        isVisible: true,
      });
    }
  }, [formData.kundId, resetKund, setKundStatus]);

  // Stäng toast
  const closeToast = useCallback(() => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  }, []);

  // Sätt till redigeringsläge
  const handleEditCustomer = useCallback(() => {
    setKundStatus("editing");
  }, [setKundStatus]);

  return {
    // State
    formData,
    kunder,
    kundStatus,
    showSuccess,
    fadeOut,
    toast,

    // Event handlers
    handleChange,
    handleSave,
    handleSelectCustomer,
    handleCreateNewCustomer,
    handleDeleteCustomer,
    handleEditCustomer,
    closeToast,
  };
}
