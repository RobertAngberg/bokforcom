"use client";

/**
 * useLeverantorModals.ts
 *
 * Hooks för leverantörsmodaler:
 * - Modal för att skapa/redigera leverantör
 * - Modal för att välja leverantör och navigera till bokföring
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveLeverantor, updateLeverantor } from "../../actions/leverantorActions";
import {
  LeverantörFormData,
  UseNyLeverantorModalReturn,
  UseNyLeverantorModalParams,
  UseValjLeverantorModalReturn,
  UseValjLeverantorModalParams,
} from "../../types/types";
import { validateLeverantörData, mapLeverantorFormData } from "./leverantorCache";
import { useLeverantörer } from "./useLeverantorer";

/**
 * Hook för modal att skapa/redigera leverantör
 */
export function useNyLeverantorModal({
  isOpen,
  editLeverantör,
  onSaved,
  onClose,
}: UseNyLeverantorModalParams): UseNyLeverantorModalReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<LeverantörFormData>({
    namn: "",
    organisationsnummer: "",
    adress: "",
    postnummer: "",
    stad: "",
    telefon: "",
    epost: "",
  });

  const isEditing = !!editLeverantör;

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setFormData({
        namn: "",
        organisationsnummer: "",
        adress: "",
        postnummer: "",
        stad: "",
        telefon: "",
        epost: "",
      });
    } else if (editLeverantör) {
      setFormData({
        namn: editLeverantör.namn || "",
        organisationsnummer: editLeverantör.organisationsnummer || "",
        adress: editLeverantör.adress || "",
        postnummer: editLeverantör.postnummer || "",
        stad: editLeverantör.ort || "",
        telefon: editLeverantör.telefon || "",
        epost: editLeverantör.email || "",
      });
    }
  }, [isOpen, editLeverantör]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Frontend-validering
      const validation = validateLeverantörData(formData);
      if (!validation.isValid) {
        setError(validation.error!);
        return;
      }

      const preparedData = mapLeverantorFormData(formData);

      if (isEditing && editLeverantör) {
        const data = {
          namn: preparedData.namn,
          organisationsnummer: preparedData.organisationsnummer || undefined,
          adress: preparedData.adress || undefined,
          postnummer: preparedData.postnummer || undefined,
          ort: preparedData.stad || undefined,
          telefon: preparedData.telefon || undefined,
          email: formData.epost || undefined,
        };
        const result = await updateLeverantor(editLeverantör.id!, data);

        if (result.success) {
          onSaved();
          onClose();
        } else {
          setError(result.error || "Kunde inte uppdatera leverantör");
        }
      } else {
        const submitData = new FormData();
        submitData.append("namn", preparedData.namn);
        if (preparedData.organisationsnummer)
          submitData.append("organisationsnummer", preparedData.organisationsnummer);
        if (preparedData.adress) submitData.append("adress", preparedData.adress);
        if (preparedData.postnummer) submitData.append("postnummer", preparedData.postnummer);
        if (preparedData.stad) submitData.append("ort", preparedData.stad);
        if (preparedData.telefon) submitData.append("telefon", preparedData.telefon);
        if (formData.epost) submitData.append("email", formData.epost);

        const result = await saveLeverantor(submitData);

        if (result.success) {
          onSaved();
          onClose();
        } else {
          setError(result.error || "Kunde inte spara leverantör");
        }
      }
    } catch {
      setError("Ett oväntat fel uppstod");
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    formData,
    isEditing,
    handleInputChange,
    handleSubmit,
    setError,
  };
}

/**
 * Hook för modal att välja leverantör och navigera till bokföring
 */
export function useValjLeverantorModal({
  isOpen,
  onClose,
}: UseValjLeverantorModalParams): UseValjLeverantorModalReturn {
  const router = useRouter();
  const [selectedLeverantör, setSelectedLeverantör] = useState<number | null>(null);
  const { refresh } = useLeverantörer();

  useEffect(() => {
    if (isOpen) {
      refresh();
    }
  }, [isOpen, refresh]);

  const handleContinue = () => {
    if (selectedLeverantör) {
      onClose();
      // Navigera till bokföringssystemet med levfakt=true
      const url = `/bokfor?levfakt=true&leverantorId=${selectedLeverantör}`;
      router.push(url);
    }
  };

  return {
    selectedLeverantör,
    setSelectedLeverantör,
    handleContinue,
  };
}
