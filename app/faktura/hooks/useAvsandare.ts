"use client";

import { useCallback, useEffect, useRef } from "react";
import { useFakturaClient, useFakturaInitialData } from "../context/hooks/FakturaContext";
import { useFakturaLifecycle } from "../context/hooks/FakturaFormContext";
import {
  hamtaForetagsprofil,
  sparaForetagsprofil as sparaForetagsprofilAction,
  uploadLogoAction,
} from "../actions/foretagActions";
import { showToast } from "../../_components/Toast";
import type { FakturaFormData } from "../types/types";

/**
 * Hook för avsändare (företagsprofil och logotyp)
 */
export function useAvsandare() {
  const { formData, setFormData } = useFakturaClient();
  const initialData = useFakturaInitialData();
  const lifecycle = useFakturaLifecycle();
  const initialForetagsprofil = initialData?.foretagsprofil;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const formDataRef = useRef(formData);

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

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

  // Ladda företagsprofil
  const loadForetagsprofil = useCallback(async () => {
    try {
      const data = await hamtaForetagsprofil();
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
          bankinfo: data.bankinfo || "",
          webbplats: data.webbplats || "",
          logo: data.logo || "",
          logoWidth: data.logoWidth || 200,
        };
        setFormData(safeData);
      }
    } catch (error) {
      console.error("Fel vid laddning av företagsprofil:", error);
      showError("Kunde inte ladda företagsprofil");
    }
  }, [setFormData, showError]);

  // Om servern redan fyllde företagsprofilen markerar vi det och hoppar över klientanropet
  useEffect(() => {
    if (lifecycle.current.harLastatForetagsprofil) {
      return;
    }

    if (initialForetagsprofil) {
      lifecycle.current.harLastatForetagsprofil = true;
      return;
    }

    lifecycle.current.harLastatForetagsprofil = true;
    loadForetagsprofil().catch((error) => {
      console.error("[useAvsandare] loadForetagsprofil effect error", error);
    });
  }, [loadForetagsprofil, lifecycle, initialForetagsprofil]);

  // Spara företagsprofil
  const sparaForetagsprofil = useCallback(async () => {
    try {
      const profilData = {
        företagsnamn: formData.företagsnamn,
        adress: formData.adress,
        postnummer: formData.postnummer,
        stad: formData.stad,
        organisationsnummer: formData.organisationsnummer,
        momsregistreringsnummer: formData.momsregistreringsnummer,
        telefonnummer: formData.telefonnummer,
        epost: formData.epost,
        bankinfo: formData.bankinfo,
        webbplats: formData.webbplats,
        logo: formData.logo,
        logoWidth: formData.logoWidth,
      };

      const result = await sparaForetagsprofilAction(profilData);
      if (result.success) {
        showSuccess("Företagsprofil sparad");
      } else {
        showError("Fel vid sparande av företagsprofil");
      }
    } catch (error) {
      console.error("Fel vid sparande:", error);
      showError("Fel vid sparande av företagsprofil");
    }
  }, [formData, showSuccess, showError]);

  // Ladda upp logotype
  const handleLogoUpload = useCallback(
    async (file: File) => {
      try {
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);
        const result = await uploadLogoAction(uploadFormData);

        if (!result.success || !result.url) {
          showError(result.error || "Fel vid uppladdning");
          return;
        }

        const nästaFormState = { ...formDataRef.current, logo: result.url };
        setFormData({ logo: result.url });

        const saveResult = await sparaForetagsprofilAction({
          företagsnamn: nästaFormState.företagsnamn,
          adress: nästaFormState.adress,
          postnummer: nästaFormState.postnummer,
          stad: nästaFormState.stad,
          organisationsnummer: nästaFormState.organisationsnummer,
          momsregistreringsnummer: nästaFormState.momsregistreringsnummer,
          telefonnummer: nästaFormState.telefonnummer,
          epost: nästaFormState.epost,
          bankinfo: nästaFormState.bankinfo,
          webbplats: nästaFormState.webbplats,
          logo: nästaFormState.logo,
          logoWidth: nästaFormState.logoWidth,
        });

        if (!saveResult.success) {
          showError("Logotypen kunde inte sparas permanent");
          return;
        }

        showSuccess("Logotyp uppladdad och sparad");
      } catch (error) {
        console.error("Upload error:", error);
        showError("Fel vid uppladdning av logotype");
      }
    },
    [setFormData, showSuccess, showError]
  );

  // Event handler för logo upload
  const hanteraLoggaUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        showError("Bara bildfiler tillåtna (PNG, JPG, GIF, WebP).");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      await handleLogoUpload(file);
    },
    [handleLogoUpload, showError]
  );

  // Event handler för textfält
  const hanteraTangentNer = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      updateFormField(name as keyof FakturaFormData, value);
    },
    [updateFormField]
  );

  return {
    // Functions
    loadForetagsprofil,
    sparaForetagsprofil,
    handleLogoUpload,
    hanteraLoggaUpload,
    hanteraTangentNer,

    // Refs
    fileInputRef,
  };
}
