"use client";

import { useState, useEffect } from "react";
import { saveLeverantör, updateLeverantör, type Leverantör } from "../actions";
import Modal from "../../_components/Modal";
import Knapp from "../../_components/Knapp";
import TextFalt from "../../_components/TextFalt";

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
    vatnummer: "",
    adress: "",
    postnummer: "",
    stad: "",
    telefon: "",
    epost: "",
    kontaktperson: "",
  });

  const isEditing = !!editLeverantör;

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      // Återställ formulär när modal stängs
      setFormData({
        namn: "",
        organisationsnummer: "",
        vatnummer: "",
        adress: "",
        postnummer: "",
        stad: "",
        telefon: "",
        epost: "",
        kontaktperson: "",
      });
    } else if (editLeverantör) {
      // Fyll i data vid redigering
      setFormData({
        namn: editLeverantör.namn || "",
        organisationsnummer: editLeverantör.organisationsnummer || "",
        vatnummer: "",
        adress: editLeverantör.adress || "",
        postnummer: editLeverantör.postnummer || "",
        stad: editLeverantör.ort || "",
        telefon: editLeverantör.telefon || "",
        epost: editLeverantör.email || "",
        kontaktperson: "",
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
      // Säkerhetsvalidering av alla fält
      if (!formData.namn.trim()) {
        setError("Företagsnamn krävs");
        return;
      }

      if (
        formData.organisationsnummer &&
        !/^\d{6}-?\d{4}$/.test(formData.organisationsnummer.replace(/\s/g, ""))
      ) {
        setError("Ogiltigt organisationsnummer (format: XXXXXX-XXXX)");
        return;
      }

      if (formData.epost && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.epost)) {
        setError("Ogiltig email-adress");
        return;
      }

      // Skapa FormData med säkra värden
      const submitData = new FormData();
      submitData.append("namn", formData.namn.trim());
      if (formData.organisationsnummer)
        submitData.append("organisationsnummer", formData.organisationsnummer.trim());
      if (formData.adress) submitData.append("adress", formData.adress.trim());
      if (formData.postnummer) submitData.append("postnummer", formData.postnummer.trim());
      if (formData.stad) submitData.append("ort", formData.stad.trim());
      if (formData.telefon) submitData.append("telefon", formData.telefon.trim());
      if (formData.epost) submitData.append("email", formData.epost.trim());

      if (isEditing && editLeverantör) {
        const data = {
          namn: formData.namn.trim(),
          organisationsnummer: formData.organisationsnummer.trim() || undefined,
          adress: formData.adress.trim() || undefined,
          postnummer: formData.postnummer.trim() || undefined,
          ort: formData.stad.trim() || undefined,
          telefon: formData.telefon.trim() || undefined,
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
              label="VAT-nummer"
              name="vatnummer"
              value={formData.vatnummer}
              onChange={handleInputChange}
              placeholder="SE############01"
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
              placeholder="123 45"
            />
            <TextFalt
              label="Stad"
              name="stad"
              value={formData.stad}
              onChange={handleInputChange}
              placeholder="Ort"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextFalt
              label="Telefon"
              name="telefon"
              type="tel"
              value={formData.telefon}
              onChange={handleInputChange}
              placeholder="070-123 45 67"
            />
            <TextFalt
              label="E-post"
              name="epost"
              type="email"
              value={formData.epost}
              onChange={handleInputChange}
              placeholder="info@företag.se"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Knapp
              text="Avbryt"
              type="button"
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700"
            />
            <Knapp
              text={loading ? "Sparar..." : isEditing ? "Uppdatera leverantör" : "Spara leverantör"}
              type="submit"
              disabled={loading}
            />
          </div>
        </form>
      </div>
    </Modal>
  );
}
