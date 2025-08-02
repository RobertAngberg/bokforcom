"use client";

import { useState } from "react";
import { saveLeverantör } from "../actions";
import Modal from "../../_components/Modal";
import Knapp from "../../_components/Knapp";

interface NyLeverantörModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const InputField = ({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
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
      className="bg-slate-800 text-white px-4 py-2 rounded-lg w-full border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-700 focus:border-cyan-700"
    />
  </div>
);

export default function NyLeverantörModal({ isOpen, onClose, onSaved }: NyLeverantörModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await saveLeverantör(formData);

      if (result.success) {
        onSaved();
        onClose();
        // Reset form
        (e.target as HTMLFormElement).reset();
      } else {
        setError(result.error || "Kunde inte spara leverantör");
      }
    } catch (err) {
      setError("Ett oväntat fel uppstod");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Lägg till ny leverantör" maxWidth="xl">
      <div className="p-6">
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField label="Företagsnamn" name="namn" required placeholder="Ange företagsnamn" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Org-nummer / VAT-nummer"
              name="organisationsnummer"
              placeholder="XXXXXX-XXXX eller SE############01"
            />
            <div></div> {/* Tom div för att hålla grid layout */}
          </div>

          <InputField label="Postadress" name="adress" placeholder="Gatuadress" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Postnummer" name="postnummer" placeholder="123 45" />
            <InputField label="Stad" name="ort" placeholder="Ort" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Telefon" name="telefon" placeholder="070-123 45 67" />
            <InputField label="E-post" name="email" type="email" placeholder="info@företag.se" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Kontaktperson"
              name="kontaktperson"
              placeholder="Förnamn Efternamn"
            />
            <InputField label="Hemsida" name="hemsida" placeholder="www.företag.se" />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1">Anteckningar</label>
            <textarea
              name="anteckningar"
              rows={3}
              className="bg-slate-800 text-white px-4 py-2 rounded-lg w-full border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-700 focus:border-cyan-700"
              placeholder="Valfria anteckningar..."
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Knapp
              text="Avbryt"
              type="button"
              onClick={onClose}
              disabled={loading}
              className="bg-gray-600 hover:bg-gray-700"
            />
            <Knapp
              text={loading ? "Sparar..." : "Spara leverantör"}
              type="submit"
              disabled={loading}
            />
          </div>
        </form>
      </div>
    </Modal>
  );
}
