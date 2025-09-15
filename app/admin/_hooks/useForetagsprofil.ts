"use client";

import { useState, useEffect } from "react";
import {
  uppdateraForetagsprofilAdmin,
  hamtaForetagsprofilAdmin,
} from "../_actions/foretagsprofilActions";
import { useAdminStore } from "../_stores/adminStore";
import type { ForetagsProfil, MeddelandeTillstand } from "../_types/types";

const TOM_FORETAG: ForetagsProfil = {
  foretagsnamn: "",
  adress: "",
  postnummer: "",
  stad: "",
  organisationsnummer: "",
  momsregistreringsnummer: "",
  telefonnummer: "",
  epost: "",
  webbplats: "",
};

export function useForetagsprofil() {
  const { foretagsInfo, setForetagsInfo, isLoadingForetag, setIsLoadingForetag } = useAdminStore();

  const [foretagsProfil, setForetagsProfil] = useState<ForetagsProfil>(foretagsInfo || TOM_FORETAG);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [companyMessage, setCompanyMessage] = useState<MeddelandeTillstand | null>(null);

  // Load company data if not already loaded
  useEffect(() => {
    if (!foretagsInfo && !isLoadingForetag) {
      setIsLoadingForetag(true);
      hamtaForetagsprofilAdmin()
        .then(setForetagsInfo)
        .catch((error) => {
          console.error("Failed to load company info:", error);
          setCompanyMessage({ type: "error", text: "Kunde inte ladda företagsinfo" });
        })
        .finally(() => setIsLoadingForetag(false));
    }
  }, [foretagsInfo, isLoadingForetag, setForetagsInfo, setIsLoadingForetag]);

  // Update local state when store changes (but not during editing to preserve user changes)
  useEffect(() => {
    if (!isEditingCompany) {
      setForetagsProfil(foretagsInfo || TOM_FORETAG);
    }
  }, [foretagsInfo, isEditingCompany]);

  const handleEditCompany = () => {
    setIsEditingCompany(true);
    setCompanyMessage(null);
  };

  const handleCancelCompany = () => {
    setIsEditingCompany(false);
    setForetagsProfil(foretagsInfo || TOM_FORETAG); // Reset to original data
    setCompanyMessage(null);
  };

  const handleSaveCompany = async () => {
    setIsSavingCompany(true);
    try {
      const result = await uppdateraForetagsprofilAdmin({ ...foretagsProfil });
      if (result.success) {
        setForetagsInfo(foretagsProfil); // Update store with saved data
        setIsEditingCompany(false);
        setCompanyMessage({ type: "success", text: "Foretagsprofil uppdaterad!" });
      } else {
        setCompanyMessage({
          type: "error",
          text: result.error || "Kunde inte uppdatera foretagsprofil",
        });
      }
    } catch (error) {
      console.error("Error updating company profile:", error);
      setCompanyMessage({ type: "error", text: "Ett fel uppstod vid uppdatering" });
    } finally {
      setIsSavingCompany(false);
    }
  };

  const normalizeField = (field: keyof ForetagsProfil, value: string): string => {
    if (field === "postnummer") {
      const digits = value.replace(/\D/g, "").slice(0, 5);
      return digits.length > 3 ? `${digits.slice(0, 3)} ${digits.slice(3)}` : digits;
    }
    if (field === "organisationsnummer") {
      const digits = value.replace(/\D/g, "").slice(0, 10);
      if (digits.length <= 6) return digits;
      return `${digits.slice(0, 6)}-${digits.slice(6)}`;
    }
    if (field === "momsregistreringsnummer") {
      let v = value.toUpperCase().replace(/\s/g, "");
      if (/^[0-9]{12}$/.test(v)) v = `SE${v}`;
      if (!/^SE[0-9]{0,12}$/.test(v)) {
        if (v.startsWith("SE")) {
          v = "SE" + v.slice(2).replace(/[^0-9]/g, "");
        } else {
          v = v.replace(/[^0-9]/g, "");
          if (v.length > 0) v = `SE${v}`;
        }
      }
      return v.slice(0, 14);
    }
    return value;
  };

  const updateCompanyField = (field: keyof ForetagsProfil, value: string) => {
    const normalized = normalizeField(field, value);
    setForetagsProfil((prev) => ({ ...prev, [field]: normalized }));
  };

  const clearCompanyMessage = () => setCompanyMessage(null);

  return {
    state: {
      foretagsProfil,
      isEditingCompany,
      isSavingCompany,
      isLoadingForetag,
      companyMessage,
    },
    actions: {
      setForetagsProfil,
      setIsEditingCompany,
      setIsSavingCompany,
      setCompanyMessage,
    },
    handlers: {
      onEditCompany: handleEditCompany,
      onCancelCompany: handleCancelCompany,
      onSaveCompany: handleSaveCompany,
      onChangeCompany: updateCompanyField,
      clearCompanyMessage,
    },
  };
}
