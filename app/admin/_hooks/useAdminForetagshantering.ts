"use client";

import { useState } from "react";
import {
  hamtaForetagsprofilAdmin,
  uppdateraForetagsprofilAdmin,
  raderaForetag,
} from "../_actions/foretagsActions";
import { signOut } from "next-auth/react";
import type {
  ForetagsProfil,
  MessageState,
  UseAdminForetagshanteringReturn,
} from "../_types/types";

/**
 * 🔥 Enterprise Hook for foretagshantering
 * - Saker CRUD operations
 * - Optimistic updates
 * - Delete confirmation flow
 */
export function useAdminForetagshantering(): UseAdminForetagshanteringReturn {
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [companyMessage, setCompanyMessage] = useState<MessageState | null>(null);

  // 🚀 Fetch company profile
  const fetchCompanyProfile = async () => {
    try {
      const data = await hamtaForetagsprofilAdmin();
      if (data) {
        setForetagsProfil(data);
      }
    } catch (error) {
      console.error("Error fetching company profile:", error);
      setCompanyMessage({
        type: "error",
        text: "Kunde inte hamta foretagsprofil",
      });
    }
  };

  // 🎯 Company management actions
  const handleEditCompany = () => {
    setIsEditingCompany(true);
    setCompanyMessage(null);
  };

  const handleCancelCompany = () => {
    setIsEditingCompany(false);
    setCompanyMessage(null);
    // Restore original values
    fetchCompanyProfile();
  };

  const handleSaveCompany = async () => {
    setIsSavingCompany(true);

    try {
      const formData = new FormData();
      Object.entries(foretagsProfil).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const result = await uppdateraForetagsprofilAdmin(formData);

      if (result.success) {
        setIsEditingCompany(false);
        setCompanyMessage({
          type: "success",
          text: "Foretagsprofil uppdaterad!",
        });
        await fetchCompanyProfile();
      } else {
        setCompanyMessage({
          type: "error",
          text: result.error || "Kunde inte uppdatera foretagsprofil",
        });
      }
    } catch (error) {
      console.error("Error updating company profile:", error);
      setCompanyMessage({
        type: "error",
        text: "Ett fel uppstod vid uppdatering",
      });
    } finally {
      setIsSavingCompany(false);
    }
  };

  const handleDeleteCompany = async () => {
    setIsDeleting(true);

    try {
      const result = await raderaForetag();

      if (result.success) {
        // Successful deletion - sign out user
        await signOut({ callbackUrl: "/" });
      } else {
        setCompanyMessage({
          type: "error",
          text: result.error || "Kunde inte radera foretag",
        });
        setShowDeleteConfirm(false);
      }
    } catch (error) {
      console.error("Error deleting company:", error);
      setCompanyMessage({
        type: "error",
        text: "Ett fel uppstod vid radering",
      });
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const updateCompanyField = (field: keyof ForetagsProfil, value: string) => {
    setForetagsProfil((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const clearCompanyMessage = () => setCompanyMessage(null);

  return {
    // Data
    foretagsProfil,

    // State
    isEditingCompany,
    isSavingCompany,
    isDeleting,
    showDeleteConfirm,
    companyMessage,

    // Actions
    handleEditCompany,
    handleCancelCompany,
    handleSaveCompany,
    handleDeleteCompany,
    updateCompanyField,
    setShowDeleteConfirm,
    clearCompanyMessage,

    // Utils
    fetchCompanyProfile,
  };
}
