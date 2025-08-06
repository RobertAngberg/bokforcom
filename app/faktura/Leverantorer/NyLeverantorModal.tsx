"use client";

import { useState, useEffect } from "react";
import { saveLeverantör, updateLeverantör, type Leverantör } from "../actions";
import Modal from "../../_components/Modal";
import Knapp from "../../_components/Knapp";

interface NyLeverantorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  editLeverantör?: Leverantör;
}

const InputField = ({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
}) => (
  <div>
    <label className="block text-sm font-medium text-white mb-1">
      {label} {required && "*"}
    </label>
    <input
      type={type}
      name={name}
      required={required}
      placeholder={placeholder}
      defaultValue={defaultValue}
      className="bg-slate-800 text-white px-4 py-2 rounded-lg w-full border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-700 focus:border-cyan-700"
    />
  </div>
);

export default function NyLeverantorModal({
  isOpen,
  onClose,
  onSaved,
  editLeverantör,
}: NyLeverantorModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!editLeverantör;

  useEffect(() => {
    if (!isOpen) {
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);

      if (isEditing && editLeverantör) {
        const data = {
          namn: formData.get("namn") as string,
          organisationsnummer: (formData.get("organisationsnummer") as string) || undefined,
          adress: (formData.get("adress") as string) || undefined,
          postnummer: (formData.get("postnummer") as string) || undefined,
          ort: (formData.get("ort") as string) || undefined,
          telefon: (formData.get("telefon") as string) || undefined,
          email: (formData.get("email") as string) || undefined,
        };
        const result = await updateLeverantör(editLeverantör.id!, data);

        if (result.success) {
          onSaved();
          onClose();
        } else {
          setError(result.error || "Kunde inte uppdatera leverantör");
        }
      } else {
        const result = await saveLeverantör(formData);

        if (result.success) {
          onSaved();
          onClose();
          // Reset form
          (e.target as HTMLFormElement).reset();
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
          <InputField
            label="Företagsnamn"
            name="namn"
            required
            placeholder="Ange företagsnamn"
            defaultValue={editLeverantör?.namn}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Org-nummer / VAT-nummer"
              name="organisationsnummer"
              placeholder="XXXXXX-XXXX eller SE############01"
              defaultValue={editLeverantör?.organisationsnummer}
            />
            <div></div> {/* Tom div för att hålla grid layout */}
          </div>

          <InputField
            label="Postadress"
            name="adress"
            placeholder="Gatuadress"
            defaultValue={editLeverantör?.adress}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Postnummer"
              name="postnummer"
              placeholder="123 45"
              defaultValue={editLeverantör?.postnummer}
            />
            <InputField
              label="Stad"
              name="ort"
              placeholder="Ort"
              defaultValue={editLeverantör?.ort}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Telefon"
              name="telefon"
              placeholder="070-123 45 67"
              defaultValue={editLeverantör?.telefon}
            />
            <InputField
              label="E-post"
              name="email"
              type="email"
              placeholder="info@företag.se"
              defaultValue={editLeverantör?.email}
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
