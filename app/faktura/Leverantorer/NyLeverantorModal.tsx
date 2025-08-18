"use client";

import { useState, useEffect } from "react";
import { saveLeverantör, updateLeverantör, type Leverantör } from "../actions";
import Modal from "../../_components/Modal";
import Knapp from "../../_components/Knapp";
import TextFalt from "../../_components/TextFalt";

//#region Business Logic - Migrated from actions.ts
// Säker text-sanitering för leverantördata
function sanitizeLeverantörInput(input: string): string {
  if (!input) return "";
  return input
    .trim()
    .replace(/[<>]/g, "") // Ta bort potentiellt farliga tecken
    .substring(0, 255); // Begränsa längd
}

// Email-validering för leverantörer
function validateLeverantörEmail(email: string): boolean {
  if (!email) return true; // Email är valfritt
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

// Validera leverantörsdata
function validateLeverantörData(formData: any): { isValid: boolean; error?: string } {
  // Validera obligatoriska fält
  const namn = sanitizeLeverantörInput(formData.namn || "");
  if (!namn || namn.length < 2) {
    return { isValid: false, error: "Leverantörsnamn krävs (minst 2 tecken)" };
  }

  // Validera email om angivet
  if (formData.epost && !validateLeverantörEmail(formData.epost)) {
    return { isValid: false, error: "Ogiltig email-adress" };
  }

  return { isValid: true };
}

// Sanitera all leverantörsdata innan spara
function sanitizeLeverantörFormData(formData: any) {
  return {
    ...formData,
    namn: sanitizeLeverantörInput(formData.namn || ""),
    organisationsnummer: sanitizeLeverantörInput(formData.organisationsnummer || ""),
    adress: sanitizeLeverantörInput(formData.adress || ""),
    postnummer: sanitizeLeverantörInput(formData.postnummer || ""),
    stad: sanitizeLeverantörInput(formData.stad || ""),
    telefon: sanitizeLeverantörInput(formData.telefon || ""),
  };
}
//#endregion

interface NyLeverantorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  editLeverantör?: Leverantör;
}

export default function NyLeverantorModal({
  isOpen,
  onClose,
  onSaved,
  editLeverantör,
}: NyLeverantorModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
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
      // Frontend-validering med migerade funktioner
      const validation = validateLeverantörData(formData);
      if (!validation.isValid) {
        setError(validation.error!);
        return;
      }

      // Sanitera data
      const sanitizedData = sanitizeLeverantörFormData(formData);

      if (isEditing && editLeverantör) {
        const data = {
          namn: sanitizedData.namn,
          organisationsnummer: sanitizedData.organisationsnummer || undefined,
          adress: sanitizedData.adress || undefined,
          postnummer: sanitizedData.postnummer || undefined,
          ort: sanitizedData.stad || undefined,
          telefon: sanitizedData.telefon || undefined,
          email: formData.epost.trim() || undefined,
        };
        const result = await updateLeverantör(editLeverantör.id!, data);

        if (result.success) {
          onSaved();
          onClose();
        } else {
          setError(result.error || "Kunde inte uppdatera leverantör");
        }
      } else {
        const submitData = new FormData();
        submitData.append("namn", sanitizedData.namn);
        if (sanitizedData.organisationsnummer)
          submitData.append("organisationsnummer", sanitizedData.organisationsnummer);
        if (sanitizedData.adress) submitData.append("adress", sanitizedData.adress);
        if (sanitizedData.postnummer) submitData.append("postnummer", sanitizedData.postnummer);
        if (sanitizedData.stad) submitData.append("ort", sanitizedData.stad);
        if (sanitizedData.telefon) submitData.append("telefon", sanitizedData.telefon);
        if (formData.epost) submitData.append("email", formData.epost.trim());

        const result = await saveLeverantör(submitData);

        if (result.success) {
          onSaved();
          onClose();
        } else {
          setError(result.error || "Kunde inte spara leverantör");
        }
      }
    } catch (err) {
      setError("Ett oväntat fel uppstod");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Redigera leverantör" : "Lägg till ny leverantör"}
      maxWidth="xl"
    >
      <div className="p-6">
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <TextFalt
            label="Företagsnamn *"
            name="namn"
            value={formData.namn}
            onChange={handleInputChange}
            placeholder="Ange företagsnamn"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextFalt
              label="Organisationsnummer"
              name="organisationsnummer"
              value={formData.organisationsnummer}
              onChange={handleInputChange}
              placeholder="XXXXXX-XXXX"
            />
            <TextFalt
              label="E-post"
              name="epost"
              value={formData.epost}
              onChange={handleInputChange}
              placeholder="kontakt@företag.se"
            />
          </div>

          <TextFalt
            label="Postadress"
            name="adress"
            value={formData.adress}
            onChange={handleInputChange}
            placeholder="Gatuadress"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextFalt
              label="Postnummer"
              name="postnummer"
              value={formData.postnummer}
              onChange={handleInputChange}
              placeholder="12345"
            />
            <TextFalt
              label="Stad"
              name="stad"
              value={formData.stad}
              onChange={handleInputChange}
              placeholder="Stockholm"
            />
          </div>

          <TextFalt
            label="Telefon"
            name="telefon"
            value={formData.telefon}
            onChange={handleInputChange}
            placeholder="08-123 456 78"
          />

          <div className="flex justify-end gap-3 pt-6">
            <Knapp text="Avbryt" onClick={onClose} disabled={loading} />
            <Knapp
              text={isEditing ? "Uppdatera leverantör" : "Spara leverantör"}
              type="submit"
              loading={loading}
              disabled={loading}
            />
          </div>
        </form>
      </div>
    </Modal>
  );
}
