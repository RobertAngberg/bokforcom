"use client";

import Knapp from "../../../_components/Knapp";
import Dropdown from "../../../_components/Dropdown";
import TextFalt from "../../../_components/TextFalt";
import { useFaktura } from "../../hooks/useFaktura";

export default function KundUppgifter() {
  const {
    formData,
    kunder,
    kundStatus,
    kundSuccessVisible,
    fadeOut,
    toastState,
    handleKundChange,
    handleKundSave,
    handleSelectCustomer,
    handleCreateNewCustomer,
    handleDeleteCustomer,
    handleEditCustomer,
    clearToast,
  } = useFaktura();

  return (
    <div className="space-y-6 text-white">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <Dropdown
          value={formData.kundId ?? ""}
          onChange={handleSelectCustomer}
          placeholder="Välj existerande kund"
          options={kunder.map((kund: any) => ({
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
              onChange={handleKundChange}
            />
            <TextFalt
              label="Organisationsnummer"
              name="kundorganisationsnummer"
              value={formData.kundorganisationsnummer}
              onChange={handleKundChange}
            />
            <TextFalt
              label="Personnummer"
              name="personnummer"
              value={formData.personnummer || ""}
              onChange={handleKundChange}
              placeholder="YYYYMMDD-XXXX (för ROT/RUT)"
            />
            <TextFalt
              label="Kundnummer"
              name="kundnummer"
              value={formData.kundnummer}
              onChange={handleKundChange}
            />
            <TextFalt
              label="Momsnummer"
              name="kundmomsnummer"
              value={formData.kundmomsnummer}
              onChange={handleKundChange}
            />
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

          <div className="pt-4 flex items-center gap-4">
            <Knapp onClick={handleKundSave} text="💾 Spara kund" />
            {kundSuccessVisible && (
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
