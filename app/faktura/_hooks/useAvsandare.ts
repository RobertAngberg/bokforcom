"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { hämtaFöretagsprofil, sparaFöretagsprofil, uploadLogoAction } from "../actions";
import { useFakturaClient } from "./useFakturaClient";
import type { ToastState, AvsandareForm } from "../_types/types";

export function useAvsandare() {
  const { formData, updateFormField, updateMultipleFields } = useFakturaClient();

  // Local state
  const [form, setForm] = useState<AvsandareForm>({
    företagsnamn: "",
    adress: "",
    postnummer: "",
    stad: "",
    organisationsnummer: "",
    momsregistreringsnummer: "",
    telefonnummer: "",
    epost: "",
    webbplats: "",
    logo: "",
    logoWidth: 200,
  });

  const [toast, setToast] = useState<ToastState>({
    message: "",
    type: "error",
    isVisible: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synka med Zustand store
  useEffect(() => {
    setForm({
      företagsnamn: formData.företagsnamn || "",
      adress: formData.adress || "",
      postnummer: formData.postnummer || "",
      stad: formData.stad || "",
      organisationsnummer: formData.organisationsnummer || "",
      momsregistreringsnummer: formData.momsregistreringsnummer || "",
      telefonnummer: formData.telefonnummer || "",
      epost: formData.epost || "",
      webbplats: formData.webbplats || "",
      logo: formData.logo || "",
      logoWidth: formData.logoWidth || 200,
    });
  }, [formData]);

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
      setForm((prev) => ({ ...prev, [name]: value }));
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
          isVisible: true,
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      try {
        const formData = new FormData();
        formData.append("file", file);
        const result = await uploadLogoAction(formData);

        if (result.success && result.url) {
          setForm((prev) => ({ ...prev, logo: result.url || "" }));
          updateFormField("logo", result.url || "");

          setToast({
            message: "Logga laddades upp!",
            type: "success",
            isVisible: true,
          });
        } else {
          setToast({
            message: result.error || "Kunde inte ladda upp logga.",
            type: "error",
            isVisible: true,
          });
        }
      } catch (error) {
        setToast({
          message: "Fel vid uppladdning av logga.",
          type: "error",
          isVisible: true,
        });
      }
    },
    [updateFormField]
  );

  const spara = useCallback(async () => {
    try {
      const dataToSave = {
        företagsnamn: form.företagsnamn,
        adress: form.adress,
        postnummer: form.postnummer,
        stad: form.stad,
        organisationsnummer: form.organisationsnummer,
        momsregistreringsnummer: form.momsregistreringsnummer,
        telefonnummer: form.telefonnummer,
        epost: form.epost,
        webbplats: form.webbplats,
      };

      const res = await sparaFöretagsprofil(dataToSave);

      if (res.success) {
        setToast({
          message: "Avsändare sparad!",
          type: "success",
          isVisible: true,
        });
      } else {
        setToast({
          message: "Kunde inte spara uppgifter.",
          type: "error",
          isVisible: true,
        });
      }
    } catch (error) {
      // Server action hanterar auth automatiskt
      setToast({
        message: "Kunde inte spara uppgifter.",
        type: "error",
        isVisible: true,
      });
    }
  }, [form]);

  const closeToast = useCallback(() => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  }, []);

  return {
    // State
    form,
    toast,
    fileInputRef,

    // Event handlers
    hanteraTangentNer,
    hanteraLoggaUpload,
    spara,
    closeToast,
  };
}
