"use client";

import { useProdukterTjanster } from "../_hooks/useProdukterTjanster";
import TextFalt from "../../_components/TextFalt";
import DatePicker from "react-datepicker";
import { registerLocale } from "react-datepicker";
import { sv } from "date-fns/locale/sv";
import "react-datepicker/dist/react-datepicker.css";
import type { RotRutFormProps } from "../_types/types";

// Registrera svensk locale för DatePicker
registerLocale("sv", sv);

export default function RotRutForm({ disabled = false }: RotRutFormProps) {
  const {
    formData,
    antal,
    prisPerEnhet,
    RUT_KATEGORIER,
    ROT_KATEGORIER,
    handleRotRutChange,
    handleRotRutBoendeTypChange,
    handleRotRutDateChange,
  } = useProdukterTjanster();

  return (
    <div className="space-y-4 p-4 bg-slate-800 rounded-lg">
      {formData.rotRutAktiverat && (
        <>
          <div className="text-white">
            <label className="block mb-1">Typ av avdrag</label>
            <select
              name="rotRutTyp"
              value={formData.rotRutTyp ?? ""}
              onChange={handleRotRutChange}
              disabled={disabled}
              className={`w-full p-2 rounded bg-slate-900 border border-slate-700 text-white ${
                disabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <option value="">Välj typ</option>
              <option value="ROT">ROT</option>
              <option value="RUT">RUT</option>
            </select>
          </div>

          {formData.rotRutTyp && (
            <div className="text-white">
              <label className="block mb-1">Välj kategori</label>
              <select
                name="rotRutKategori"
                value={formData.rotRutKategori ?? ""}
                onChange={handleRotRutChange}
                disabled={disabled}
                className={`w-full p-2 rounded bg-slate-900 border border-slate-700 text-white ${
                  disabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <option value="">Välj kategori</option>
                {(formData.rotRutTyp === "ROT" ? ROT_KATEGORIER : RUT_KATEGORIER).map(
                  (kategori: string) => (
                    <option key={kategori} value={kategori}>
                      {kategori}
                    </option>
                  )
                )}
              </select>
              {/* DEBUG: Checking if something renders here */}
            </div>
          )}

          {/* ROT/RUT-specifika fält */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Visa beräknad arbetskostnad baserat på huvudformulär */}
            {!!(antal && prisPerEnhet && Number(antal) > 0 && Number(prisPerEnhet) > 0) && (
              <div className="md:col-span-2 p-3 bg-slate-700 rounded">
                <div className="text-white">
                  <span className="font-semibold">Beräknad arbetskostnad exkl. moms:</span>{" "}
                  {(Number(antal) * Number(prisPerEnhet)).toLocaleString("sv-SE", {
                    style: "currency",
                    currency: "SEK",
                  })}
                </div>
              </div>
            )}

            {/* ROT/RUT-beskrivning - tar hela bredden */}
            <div className="md:col-span-2">
              <TextFalt
                label={`Beskrivning av ${formData.rotRutTyp}-tjänst *`}
                name="rotRutBeskrivning"
                value={formData.rotRutBeskrivning ?? ""}
                onChange={handleRotRutChange}
                placeholder="Beskriv de avdraggivna tjänsterna..."
                disabled={disabled}
                className={`${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
              />
              <p className="text-xs text-gray-400 mt-1">
                Ex: "Målning av sovrum och vardagsrum", "Städning av hela bostaden"
              </p>
            </div>

            {/* Period för arbetet */}
            <div>
              <label className="block text-white font-semibold mb-1">
                Startdatum för arbetet *
              </label>
              <DatePicker
                selected={
                  formData.rotRutStartdatum ? new Date(formData.rotRutStartdatum) : new Date()
                }
                onChange={(date) => handleRotRutDateChange("rotRutStartdatum", date)}
                dateFormat="yyyy-MM-dd"
                locale="sv"
                placeholderText="Välj startdatum"
                disabled={disabled}
                className={`w-full p-2 rounded bg-slate-900 border border-slate-700 text-white ${
                  disabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
                required
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-1">Slutdatum för arbetet *</label>
              <DatePicker
                selected={formData.rotRutSlutdatum ? new Date(formData.rotRutSlutdatum) : null}
                onChange={(date) => handleRotRutDateChange("rotRutSlutdatum", date)}
                dateFormat="yyyy-MM-dd"
                locale="sv"
                placeholderText="Välj slutdatum"
                minDate={
                  formData.rotRutStartdatum ? new Date(formData.rotRutStartdatum) : undefined
                }
                disabled={disabled}
                className={`w-full p-2 rounded bg-slate-900 border border-slate-700 text-white ${
                  disabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
                required
              />
            </div>

            {/* Personnummer för både ROT och RUT */}
            <TextFalt
              label="Personnummer (den som får avdraget) *"
              name="personnummer"
              type="text"
              value={formData.personnummer ?? ""}
              onChange={handleRotRutChange}
              placeholder="YYYYMMDD-XXXX"
              required={true}
              disabled={disabled}
            />

            {formData.rotRutTyp === "ROT" && (
              <div className="md:col-span-2">
                <div className="flex items-center gap-6 mb-4">
                  <label className="text-white font-semibold">Typ av boende:</label>
                  <div className="flex gap-4">
                    <label className="flex items-center text-white">
                      <input
                        type="radio"
                        name="rotBoendeTyp"
                        value="fastighet"
                        checked={formData.rotBoendeTyp !== "brf"}
                        disabled={disabled}
                        onChange={() => handleRotRutBoendeTypChange("fastighet")}
                        className={`mr-2 ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                      />
                      Fastighetsbeteckning
                    </label>
                    <label className="flex items-center text-white">
                      <input
                        type="radio"
                        name="rotBoendeTyp"
                        value="brf"
                        checked={formData.rotBoendeTyp === "brf"}
                        disabled={disabled}
                        onChange={() => handleRotRutBoendeTypChange("brf")}
                        className={`mr-2 ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                      />
                      Bostadsrättsförening
                    </label>
                  </div>
                </div>
                {/* Fastighetsbeteckning */}
                {formData.rotBoendeTyp !== "brf" && (
                  <TextFalt
                    label="Fastighetsbeteckning"
                    name="fastighetsbeteckning"
                    type="text"
                    value={formData.fastighetsbeteckning ?? ""}
                    onChange={handleRotRutChange}
                    required={true}
                    disabled={disabled}
                  />
                )}
                {/* Bostadsrättsförening */}
                {formData.rotBoendeTyp === "brf" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextFalt
                      label="Organisationsnummer (BRF)"
                      name="brfOrganisationsnummer"
                      type="text"
                      value={formData.brfOrganisationsnummer ?? ""}
                      onChange={handleRotRutChange}
                      required={true}
                      disabled={disabled}
                    />
                    <TextFalt
                      label="Lägenhetsnummer"
                      name="brfLagenhetsnummer"
                      type="text"
                      value={formData.brfLagenhetsnummer ?? ""}
                      onChange={handleRotRutChange}
                      required={true}
                      disabled={disabled}
                    />
                  </div>
                )}
              </div>
            )}

            {/* RUT har inga extra fält */}
          </div>

          {formData.avdragBelopp !== undefined && formData.avdragBelopp > 0 && (
            <div className="text-white font-semibold mt-4">
              Avdrag (50% av belopp inkl. moms):{" "}
              {formData.avdragBelopp.toLocaleString("sv-SE", {
                style: "currency",
                currency: "SEK",
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
