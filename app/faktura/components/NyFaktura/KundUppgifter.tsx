"use client";

import Knapp from "../../../_components/Knapp";
import Dropdown from "../../../_components/Dropdown";
import TextFalt from "../../../_components/TextFalt";
import Modal from "../../../_components/Modal";
import { useFaktura } from "../../hooks/useFaktura";

type Kund = {
  id: number;
  kundnamn: string;
};

export default function KundUppgifter() {
  const {
    formData,
    kunder,
    kundStatus,
    handleKundChange,
    handleKundSave,
    handleSelectCustomer,
    handleCreateNewCustomer,
    handleDeleteCustomer,
    handleEditCustomer,
    showDeleteKundModal,
    setShowDeleteKundModal,
    confirmDeleteKund,
  } = useFaktura();

  return (
    <div className="space-y-6 text-white">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <Dropdown
          value={formData.kundId ?? ""}
          onChange={handleSelectCustomer}
          placeholder="Välj existerande kund"
          options={kunder.map((kund: Kund) => ({
            label: kund.kundnamn,
            value: kund.id.toString(),
          }))}
          className="w-full md:max-w-[220px]"
        />

        {kundStatus === "loaded" && (
          <div className="flex gap-2">
            <Knapp onClick={handleEditCustomer} text="👤 Redigera kund" />
            <Knapp onClick={handleDeleteCustomer} text="🗑️ Ta bort kund" />
          </div>
        )}

        <Knapp onClick={handleCreateNewCustomer} text="👤 Skapa ny kund" />
      </div>

      {kundStatus === "loaded" && (
        <div className="space-y-2 bg-slate-800 p-4 rounded">
          <p>
            <strong>Kundnamn:</strong> {formData.kundnamn}
          </p>
          <p>
            <strong>Organisationsnummer:</strong> {formData.kundorganisationsnummer}
          </p>
          {formData.personnummer && (
            <p>
              <strong>Personnummer:</strong> {formData.personnummer}
            </p>
          )}
          <p>
            <strong>Kundnummer:</strong> {formData.kundnummer}
          </p>
          <p>
            <strong>Momsnummer:</strong> {formData.kundmomsnummer}
          </p>
          <p>
            <strong>Adress:</strong> {formData.kundadress}
          </p>
          <p>
            <strong>Postnummer & Stad:</strong> {formData.kundpostnummer} {formData.kundstad}
          </p>
          <p>
            <strong>E‑post:</strong> {formData.kundemail}
          </p>
        </div>
      )}

      {kundStatus === "editing" && (
        <>
          {/* Kundtyp radio buttons */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-3">Kundtyp</label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="kundtyp"
                  value="företag"
                  checked={!formData.personnummer || formData.personnummer === ""}
                  onChange={() =>
                    handleKundChange({
                      target: { name: "personnummer", value: "" },
                    } as React.ChangeEvent<HTMLInputElement>)
                  }
                  className="w-4 h-4 text-cyan-600 bg-slate-700 border-slate-500 focus:ring-cyan-500"
                />
                <span className="text-slate-200">Företag</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="kundtyp"
                  value="privat"
                  checked={formData.personnummer !== "" && formData.personnummer !== undefined}
                  onChange={() => {
                    if (!formData.personnummer) {
                      handleKundChange({
                        target: { name: "personnummer", value: " " },
                      } as React.ChangeEvent<HTMLInputElement>);
                    }
                  }}
                  className="w-4 h-4 text-cyan-600 bg-slate-700 border-slate-500 focus:ring-cyan-500"
                />
                <span className="text-slate-200">Privatkund</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TextFalt
              label="Kundnamn"
              name="kundnamn"
              value={formData.kundnamn}
              onChange={handleKundChange}
            />
            {/* Visa bara för Företag */}
            {(!formData.personnummer || formData.personnummer === "") && (
              <>
                <TextFalt
                  label="Organisationsnummer"
                  name="kundorganisationsnummer"
                  value={formData.kundorganisationsnummer}
                  onChange={handleKundChange}
                />
                <TextFalt
                  label="Momsnummer"
                  name="kundmomsnummer"
                  value={formData.kundmomsnummer}
                  onChange={handleKundChange}
                />
              </>
            )}
            {/* Visa bara för Privatkund */}
            {formData.personnummer !== "" && formData.personnummer !== undefined && (
              <TextFalt
                label="Personnummer"
                name="personnummer"
                value={formData.personnummer || ""}
                onChange={handleKundChange}
                placeholder="YYYYMMDD-XXXX (för ROT/RUT)"
              />
            )}
            <TextFalt
              label="E‑post"
              name="kundemail"
              value={formData.kundemail}
              onChange={handleKundChange}
            />
            <TextFalt
              label="Adress"
              name="kundadress"
              value={formData.kundadress}
              onChange={handleKundChange}
            />
            <TextFalt
              label="Postnummer"
              name="kundpostnummer"
              value={formData.kundpostnummer}
              onChange={handleKundChange}
            />
            <TextFalt
              label="Stad"
              name="kundstad"
              value={formData.kundstad}
              onChange={handleKundChange}
            />
          </div>

          <div className="pt-4">
            <Knapp onClick={handleKundSave} text="💾 Spara kund" />
          </div>
        </>
      )}

      <Modal
        isOpen={showDeleteKundModal}
        onClose={() => setShowDeleteKundModal(false)}
        title="🗑️ Ta bort kund"
        maxWidth="md"
      >
        <div className="space-y-6">
          <p className="text-slate-200">
            Är du säker på att du vill ta bort kunden
            {formData.kundnamn ? ` "${formData.kundnamn}"` : ""}? Den här åtgärden går inte att
            ångra.
          </p>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowDeleteKundModal(false)}
              className="px-4 py-2 rounded border border-slate-500 text-slate-200 hover:bg-slate-700 transition"
            >
              Avbryt
            </button>
            <button
              onClick={confirmDeleteKund}
              className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition"
            >
              Ta bort kunden
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
