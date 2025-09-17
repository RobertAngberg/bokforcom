"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  hämtaFöretagsprofil,
  sparaFöretagsprofil,
  uploadLogoAction,
} from "../_actions/foretagActions";
import { useFakturaClient } from "./useFakturaClient";

export function useAvsandare() {
  const { formData, updateFormField, updateMultipleFields, toastState, setToast, clearToast } =
    useFakturaClient();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ladda företagsprofil när komponenten mountas
  useEffect(() => {
    const ladda = async () => {
      try {
        const data = await hämtaFöretagsprofil();
        if (data) {
          const safeData = {
            företagsnamn: data.företagsnamn || "",
            adress: data.adress || "",
            postnummer: data.postnummer || "",
            stad: data.stad || "",
            organisationsnummer: data.organisationsnummer || "",
            momsregistreringsnummer: data.momsregistreringsnummer || "",
            telefonnummer: data.telefonnummer || "",
            epost: data.epost || "",
            webbplats: data.webbplats || "",
            logo: data.logo || "",
            logoWidth: data.logo_width || 200,
          };

          // Bara uppdatera Zustand store, inte lokal state
          updateMultipleFields(safeData);
        }
      } catch (error) {
        // Server action redirectar automatiskt till login om inte authed
        console.log("Auth redirect eller fel vid hämtning av företagsprofil");
      }
    };

    ladda();
  }, [updateMultipleFields]);

  // Event handlers
  const hanteraTangentNer = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      // Uppdatera Zustand store direkt
      updateFormField(name as keyof typeof formData, value);
    },
    [updateFormField, formData]
  );

  const hanteraLoggaUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        setToast({
          message: "Bara bildfiler tillåtna (PNG, JPG, GIF, WebP).",
          type: "error",
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      try {
        const formData = new FormData();
        formData.append("file", file);
        const result = await uploadLogoAction(formData);

        if (result.success && result.url) {
          updateFormField("logo", result.url || "");

          setToast({
            message: "Logga laddades upp!",
            type: "success",
          });
        } else {
          setToast({
            message: result.error || "Kunde inte ladda upp logga.",
            type: "error",
          });
        }
      } catch (error) {
        setToast({
          message: "Fel vid uppladdning av logga.",
          type: "error",
        });
      }
    },
    [updateFormField]
  );

  const spara = useCallback(async () => {
    try {
      const dataToSave = {
        företagsnamn: formData.företagsnamn,
        adress: formData.adress,
        postnummer: formData.postnummer,
        stad: formData.stad,
        organisationsnummer: formData.organisationsnummer,
        momsregistreringsnummer: formData.momsregistreringsnummer,
        telefonnummer: formData.telefonnummer,
        epost: formData.epost,
        webbplats: formData.webbplats,
      };

      const res = await sparaFöretagsprofil(dataToSave);

      if (res.success) {
        setToast({
          message: "Avsändare sparad!",
          type: "success",
        });
      } else {
        setToast({
          message: "Kunde inte spara uppgifter.",
          type: "error",
        });
      }
    } catch (error) {
      // Server action hanterar auth automatiskt
      setToast({
        message: "Kunde inte spara uppgifter.",
        type: "error",
      });
    }
  }, [formData, setToast]);

  const closeToast = useCallback(() => {
    clearToast();
  }, [clearToast]);

  return {
    // State
    form: formData, // Använd formData från Zustand direkt
    toast: toastState,
    fileInputRef,

    // Event handlers
    hanteraTangentNer,
    hanteraLoggaUpload,
    spara,
    closeToast,
  };
}
