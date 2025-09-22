"use client";

import Knapp from "../../../_components/Knapp";
import Dropdown from "../../../_components/Dropdown";
import TextFalt from "../../../_components/TextFalt";
import Toast from "../../../_components/Toast";
import { useKundUppgifter } from "../../hooks/useKundUppgifter";

export default function KundUppgifter() {
  const {
    formData,
    kunder,
    kundStatus,
    showSuccess,
    fadeOut,
    toastState,
    handleChange,
    handleSave,
    handleSelectCustomer,
    handleCreateNewCustomer,
    handleDeleteCustomer,
    handleEditCustomer,
    closeToast,
  } = useKundUppgifter();

  return (
    <div className="space-y-6 text-white">
      <Toast
        message={toastState.message}
        type={toastState.type}
        isVisible={toastState.isVisible}
        onClose={closeToast}
      />

      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <Dropdown
          value={formData.kundId ?? ""}
          onChange={handleSelectCustomer}
          placeholder="Välj existerande kund"
          options={kunder.map((kund) => ({
            label: kund.kundnamn,
            value: kund.id.toString(),
          }))}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TextFalt
              label="Kundnamn"
              name="kundnamn"
              value={formData.kundnamn}
              onChange={handleChange}
            />
            <TextFalt
              label="Organisationsnummer"
              name="kundorganisationsnummer"
              value={formData.kundorganisationsnummer}
              onChange={handleChange}
            />
            <TextFalt
              label="Personnummer"
              name="personnummer"
              value={formData.personnummer || ""}
              onChange={handleChange}
              placeholder="YYYYMMDD-XXXX (för ROT/RUT)"
            />
            <TextFalt
              label="Kundnummer"
              name="kundnummer"
              value={formData.kundnummer}
              onChange={handleChange}
            />
            <TextFalt
              label="Momsnummer"
              name="kundmomsnummer"
              value={formData.kundmomsnummer}
              onChange={handleChange}
            />
            <TextFalt
              label="E‑post"
              name="kundemail"
              value={formData.kundemail}
              onChange={handleChange}
            />
            <TextFalt
              label="Adress"
              name="kundadress"
              value={formData.kundadress}
              onChange={handleChange}
            />
            <TextFalt
              label="Postnummer"
              name="kundpostnummer"
              value={formData.kundpostnummer}
              onChange={handleChange}
            />
            <TextFalt
              label="Stad"
              name="kundstad"
              value={formData.kundstad}
              onChange={handleChange}
            />
          </div>

          <div className="pt-4 flex items-center gap-4">
            <Knapp onClick={handleSave} text="💾 Spara kund" />
            {showSuccess && (
              <span
                className={`text-green-400 transition-opacity duration-500 ${fadeOut ? "opacity-0" : "opacity-100"}`}
              >
                ✅ Sparat!
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
