"use client";

import { useFaktura } from "../../../hooks/useFaktura";
import { useProdukterTjanster } from "../../../hooks/useProdukterTjanster";
import TextFalt from "../../../../_components/TextFalt";
import { datePickerValue } from "../../../../_utils/datum";
import { formatCurrency } from "../../../../_utils/format";
import DatePicker from "react-datepicker";
import { registerLocale } from "react-datepicker";
import { sv } from "date-fns/locale/sv";
import "react-datepicker/dist/react-datepicker.css";
import type { Artikel, RotRutFormProps } from "../../../types/types";
registerLocale("sv", sv);

export default function RotRutForm({ disabled = false }: RotRutFormProps) {
  const { formData } = useFaktura();
  const {
    RUT_KATEGORIER,
    ROT_KATEGORIER,
    handleRotRutChange,
    handleRotRutBoendeTypChange,
    handleRotRutDateChange,
    artiklar,
    rotRutSummary,
    uppdateraArtikelRotRutArbete,
    uppdateraArtikelRotRutMaterial,
  } = useProdukterTjanster();

  const startDateValue = datePickerValue(formData.rotRutStartdatum);
  const endDateValue = datePickerValue(formData.rotRutSlutdatum);
  const rotRutArtiklar = artiklar
    .map((artikel, index) => ({ artikel, index }))
    .filter(({ artikel }) => Boolean(artikel.rotRutTyp));
  const arbeteSumExkl = rotRutSummary.rotRutTjänsterSumExkl ?? 0;
  const materialSumExkl = rotRutSummary.rotRutMaterialSumExkl ?? 0;
  const rotRutTotalExkl = arbeteSumExkl + materialSumExkl;
  const beraknatAvdrag = Number(formData.avdragBelopp ?? rotRutSummary.rotRutAvdrag ?? 0);

  const arRotRutArbete = (artikel: Artikel) => {
    if (!artikel.rotRutTyp) return false;
    if (typeof artikel.rotRutArbete === "boolean") {
      return artikel.rotRutArbete;
    }
    return artikel.typ === "tjänst" && artikel.rotRutMaterial !== true;
  };

  const arRotRutMaterial = (artikel: Artikel) => {
    if (!artikel.rotRutTyp) return false;
    if (typeof artikel.rotRutMaterial === "boolean") {
      return artikel.rotRutMaterial;
    }
    return false;
  };

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
              {/* DEBUG: Checking if något renderas här */}
            </div>
          )}

          {/* ROT/RUT-specifika fält */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rotRutArtiklar.length > 0 && (
              <div className="md:col-span-2 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded bg-slate-700 p-3">
                    <div className="text-xs uppercase tracking-wide text-slate-300">
                      Arbete (avdrag)
                    </div>
                    <div className="text-lg font-semibold text-white">
                      {formatCurrency(arbeteSumExkl)}
                    </div>
                  </div>
                  <div className="rounded bg-slate-700 p-3">
                    <div className="text-xs uppercase tracking-wide text-slate-300">
                      Material (rapporteras)
                    </div>
                    <div className="text-lg font-semibold text-white">
                      {formatCurrency(materialSumExkl)}
                    </div>
                  </div>
                  <div className="rounded bg-slate-700 p-3">
                    <div className="text-xs uppercase tracking-wide text-slate-300">
                      Totalt ROT/RUT
                    </div>
                    <div className="text-lg font-semibold text-white">
                      {formatCurrency(rotRutTotalExkl)}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {rotRutArtiklar.map(({ artikel, index }) => {
                    const radTotalExkl =
                      Number(artikel.antal || 0) * Number(artikel.prisPerEnhet || 0);
                    const arbeteChecked = arRotRutArbete(artikel);
                    const materialChecked = arRotRutMaterial(artikel);

                    return (
                      <div
                        key={`${artikel.beskrivning || "artikel"}-${index}`}
                        className="flex flex-col gap-3 rounded border border-slate-700 bg-slate-900/40 p-3 md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <div className="text-sm font-semibold text-white">
                            {artikel.beskrivning || `Artikel ${index + 1}`}
                          </div>
                          <div className="text-xs text-slate-300">
                            {Number(artikel.antal) || 0} st ×{" "}
                            {formatCurrency(Number(artikel.prisPerEnhet) || 0)} ={" "}
                            {formatCurrency(radTotalExkl)}
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-white">
                          {artikel.typ === "tjänst" && (
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={arbeteChecked}
                                onChange={(e) =>
                                  uppdateraArtikelRotRutArbete(index, e.target.checked)
                                }
                                disabled={disabled}
                                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                              />
                              <span>Arbete</span>
                            </label>
                          )}
                          {artikel.typ === "vara" && (
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={materialChecked}
                                onChange={(e) =>
                                  uppdateraArtikelRotRutMaterial(index, e.target.checked)
                                }
                                disabled={disabled}
                                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                              />
                              <span>Material</span>
                            </label>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {rotRutArtiklar.length === 0 && (
              <div className="md:col-span-2 rounded bg-slate-700 p-3 text-sm text-slate-200">
                Koppla artiklar till ROT/RUT genom att markera dem i artikel-listan.
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
                Ex: &ldquo;Målning av sovrum och vardagsrum&rdquo;, &ldquo;Städning av hela
                bostaden&rdquo;
              </p>
            </div>

            {/* Period för arbetet */}
            <div>
              <label className="block text-white font-semibold mb-1">
                Startdatum för arbetet *
              </label>
              <DatePicker
                selected={startDateValue}
                onChange={(date) => handleRotRutDateChange("rotRutStartdatum", date)}
                selectsStart
                startDate={startDateValue}
                endDate={endDateValue}
                dateFormat="yyyy-MM-dd"
                locale="sv"
                placeholderText="Välj startdatum"
                disabled={disabled}
                isClearable
                className={`w-full px-3 py-2 rounded-lg bg-slate-900 text-white border border-slate-700 ${
                  disabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
                required
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-1">Slutdatum för arbetet *</label>
              <DatePicker
                selected={endDateValue}
                onChange={(date) => handleRotRutDateChange("rotRutSlutdatum", date)}
                selectsEnd
                startDate={startDateValue}
                endDate={endDateValue}
                minDate={startDateValue ?? undefined}
                dateFormat="yyyy-MM-dd"
                locale="sv"
                placeholderText="Välj slutdatum"
                disabled={disabled}
                isClearable
                className={`w-full px-3 py-2 rounded-lg bg-slate-900 text-white border border-slate-700 ${
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

          {beraknatAvdrag > 0 && (
            <div className="text-white font-semibold mt-4">
              Avdrag (50% av belopp inkl. moms): {formatCurrency(beraknatAvdrag)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
