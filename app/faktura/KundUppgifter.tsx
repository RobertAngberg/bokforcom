//#region Huvud
"use client";

import { useState, useEffect } from "react";
import { useFakturaContext } from "./FakturaProvider";
import { sparaNyKund, deleteKund, hämtaSparadeKunder, uppdateraKund } from "./actions";
import Knapp from "../_components/Knapp";
import Dropdown from "../_components/Dropdown";
import TextFalt from "../_components/TextFalt";

type KundSaveResponse = {
  success: boolean;
  id?: number;
};
//#endregion

export default function KundUppgifter() {
  //#region State och context
  const { formData, setFormData, kundStatus, setKundStatus, resetKund } = useFakturaContext();
  const [showSuccess, setShowSuccess] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [kunder, setKunder] = useState<any[]>([]);
  //#endregion

  useEffect(() => {
    const laddaKunder = async () => {
      const sparade = await hämtaSparadeKunder();
      setKunder(sparade.sort((a: any, b: any) => a.kundnamn.localeCompare(b.kundnamn)));
    };
    laddaKunder();
  }, []);

  //#region Formulärhanterare
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (kundStatus === "loaded") setKundStatus("editing");
  };

  const handleSave = async () => {
    const fd = new FormData();
    fd.append("kundnamn", formData.kundnamn);
    fd.append("kundorgnummer", formData.kundorganisationsnummer);
    fd.append("kundnummer", formData.kundnummer);
    fd.append("kundmomsnummer", formData.kundmomsnummer);
    fd.append("kundadress1", formData.kundadress);
    fd.append("kundpostnummer", formData.kundpostnummer);
    fd.append("kundstad", formData.kundstad);
    fd.append("kundemail", formData.kundemail);

    const res: KundSaveResponse = formData.kundId
      ? await uppdateraKund(parseInt(formData.kundId, 10), fd)
      : await sparaNyKund(fd);

    if (res.success) {
      if (!formData.kundId && res.id) {
        setFormData((p) => ({ ...p, kundId: res.id!.toString() }));
      }
      setKundStatus("loaded");
      setShowSuccess(true);
      setFadeOut(false);
      setTimeout(() => setFadeOut(true), 1500);
      setTimeout(() => setShowSuccess(false), 3000);
    } else {
      alert("❌ Kunde inte spara kund");
    }
  };

  const handleSelectCustomer = (kundId: string) => {
    const valdKund = kunder.find((k) => k.id.toString() === kundId);
    if (!valdKund) return;

    setFormData((prev) => ({
      ...prev,
      kundId: valdKund.id.toString(),
      kundnamn: valdKund.kundnamn,
      kundorganisationsnummer: valdKund.kundorgnummer,
      kundnummer: valdKund.kundnummer,
      kundmomsnummer: valdKund.kundmomsnummer,
      kundadress: valdKund.kundadress1,
      kundpostnummer: valdKund.kundpostnummer,
      kundstad: valdKund.kundstad,
      kundemail: valdKund.kundemail,
    }));
    setKundStatus("loaded");
  };

  const handleCreateNewCustomer = () => {
    resetKund();
    setKundStatus("editing");
  };

  const handleDeleteCustomer = async () => {
    if (!formData.kundId) return;
    if (!confirm("Är du säker på att du vill ta bort kunden?")) return;
    await deleteKund(parseInt(formData.kundId, 10));
    resetKund();
    setKundStatus("none");
    const sparade = await hämtaSparadeKunder();
    setKunder(sparade.sort((a: any, b: any) => a.kundnamn.localeCompare(b.kundnamn)));
  };
  //#endregion

  return (
    <div className="space-y-6 text-white">
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
            <Knapp onClick={() => setKundStatus("editing")} text="👤 Redigera kund" />
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
