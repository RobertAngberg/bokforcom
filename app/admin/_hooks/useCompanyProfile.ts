"use client";

import { useState } from "react";
import { hamtaForetagsprofilAdmin, uppdateraForetagsprofilAdmin } from "../_actions";
import type { ForetagsProfil, MessageState } from "../_types/types";

export const useCompanyProfile = () => {
  const [foretagsProfil, setForetagsProfil] = useState<ForetagsProfil>({
    foretagsnamn: "",
    adress: "",
    postnummer: "",
    stad: "",
    organisationsnummer: "",
    momsregistreringsnummer: "",
    telefonnummer: "",
    epost: "",
    webbplats: "",
  });
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [companyMessage, setCompanyMessage] = useState<MessageState | null>(null);

  const fetchCompanyProfile = async () => {
    try {
      const data = await hamtaForetagsprofilAdmin();
      if (data) {
        setForetagsProfil(data);
      }
    } catch (error) {
      console.error("Error fetching company profile:", error);
    }
  };

  const handleEditCompany = () => {
    setIsEditingCompany(true);
    setCompanyMessage(null);
  };

  const handleCancelCompany = () => {
    setIsEditingCompany(false);
    // Reset to original data
    fetchCompanyProfile();
    setCompanyMessage(null);
  };

  const handleSaveCompany = async () => {
    setIsSavingCompany(true);
    try {
      const formData = new FormData();
      Object.entries(foretagsProfil).forEach(([key, value]) => {
        formData.append(key, value as string);
      });

      const result = await uppdateraForetagsprofilAdmin(formData);

      if (result.success) {
        setIsEditingCompany(false);
        setCompanyMessage({ type: "success", text: "Företagsprofil uppdaterad!" });
        // Refresh data
        await fetchCompanyProfile();
      } else {
        setCompanyMessage({ type: "error", text: result.error || "Ett fel uppstod" });
      }
    } catch (error) {
      setCompanyMessage({ type: "error", text: "Ett oväntat fel uppstod" });
    } finally {
      setIsSavingCompany(false);
    }
  };

  const handleCompanyInputChange = (field: keyof ForetagsProfil, value: string) => {
    setForetagsProfil((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return {
    // State
    foretagsProfil,
    isEditingCompany,
    isSavingCompany,
    companyMessage,

    // Actions
    fetchCompanyProfile,
    handleEditCompany,
    handleCancelCompany,
    handleSaveCompany,
    handleCompanyInputChange,
    setCompanyMessage,
  };
};
