"use client";

import Modal from "../../_components/Modal";
import Knapp from "../../_components/Knapp";
import TextFalt from "../../_components/TextFalt";
import { NyLeverantorModalProps } from "../_types/types";
import { useNyLeverantorModal } from "../_hooks/useLeverantorer";

export default function NyLeverantorModal({
  isOpen,
  onClose,
  onSaved,
  editLeverantör,
}: NyLeverantorModalProps) {
  const { loading, error, formData, isEditing, handleInputChange, handleSubmit } =
    useNyLeverantorModal({
      isOpen,
      editLeverantör,
      onSaved,
      onClose,
    });

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
