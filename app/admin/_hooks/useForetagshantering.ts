"use client";

import { useState, useRef, useMemo } from "react";
import { uppdateraForetagsprofilAdmin } from "../_actions/foretagsActions";
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

export function useAdminForetagshantering(initialForetag: ForetagsProfil | null) {
  const [foretagsProfil, setForetagsProfil] = useState<ForetagsProfil>(
    initialForetag || TOM_FORETAG
  );
  // Snapshot av ursprungliga värden (används ev. senare för jämförelse / undo)
  const originalRef = useRef(initialForetag || TOM_FORETAG);

  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [companyMessage, setCompanyMessage] = useState<MeddelandeTillstand | null>(null);

  const handleEditCompany = () => {
    setIsEditingCompany(true);
    setCompanyMessage(null);
  };

  const handleCancelCompany = () => {
    setIsEditingCompany(false);
    setCompanyMessage(null);
  };

  const handleSaveCompany = async () => {
    setIsSavingCompany(true);

    try {
      const result = await uppdateraForetagsprofilAdmin({ ...foretagsProfil });

      if (result.success) {
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
      setCompanyMessage({
        type: "error",
        text: "Ett fel uppstod vid uppdatering",
      });
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
      const digits = value.replace(/\D/g, "").slice(0, 10); // 10 siffror
      if (digits.length <= 6) return digits; // skrivs progressivt
      return `${digits.slice(0, 6)}-${digits.slice(6)}`;
    }
    if (field === "momsregistreringsnummer") {
      let v = value.toUpperCase().replace(/\s/g, "");
      // Om exakt 12 siffror skrivits utan SE – prefixa
      if (/^[0-9]{12}$/.test(v)) v = `SE${v}`;
      // Tillåt format SE + 12 siffror
      if (!/^SE[0-9]{0,12}$/.test(v)) {
        // Rensa allt utom SE + siffror i början
        if (v.startsWith("SE")) {
          v = "SE" + v.slice(2).replace(/[^0-9]/g, "");
        } else {
          v = v.replace(/[^0-9]/g, "");
          if (v.length > 0) v = `SE${v}`; // börja bygga korrekt
        }
      }
      return v.slice(0, 14); // SE + 12 siffror = 14 tecken
    }
    return value; // default – ingen normalisering
  };

  const updateCompanyField = (field: keyof ForetagsProfil, value: string) => {
    const normalized = normalizeField(field, value);
    setForetagsProfil((prev) => ({
      ...prev,
      [field]: normalized,
    }));
  };

  const clearCompanyMessage = () => setCompanyMessage(null);

  return {
    // Data
    foretagsProfil,

    // State (företagsprofilsektion)
    isEditingCompany,
    isSavingCompany,
    companyMessage,

    // Matchar Företagsprofil-komponentens props
    onEditCompany: handleEditCompany,
    onCancelCompany: handleCancelCompany,
    onSaveCompany: handleSaveCompany,
    onChangeCompany: updateCompanyField,

    // Övrigt
    clearCompanyMessage,
  };
}
