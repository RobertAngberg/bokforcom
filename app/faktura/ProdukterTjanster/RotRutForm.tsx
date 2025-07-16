//#region Huvud
"use client";

import { useFakturaContext } from "../FakturaProvider";
import { useEffect, useMemo } from "react";
import TextFält from "../../_components/TextFält";

type RotRutFormProps = {
  showCheckbox?: boolean;
};
//#endregion

export default function RotRutForm({}: RotRutFormProps) {
  const { formData, setFormData, nyArtikel } = useFakturaContext();
  // Använd useMemo för artiklar för att slippa eslint-varning
  const artiklar = useMemo(() => formData.artiklar || [], [formData.artiklar]);

  const rutKategorier = [
    "Passa barn",
    "Fiber- och it-tjänster",
    "Flytta och packa",
    "Transport till försäljning för återanvändning",
    "Möblering",
    "Ta hand om en person och ge omsorg",
    "Reparera vitvaror",
    "Skotta snö",
    "Städa",
    "Tvätta, laga och sy",
    "Tvätt vid tvättinrättning",
    "Trädgårdsarbete – fälla och beskära träd",
    "Trädgårdsarbete – underhålla, klippa och gräva",
    "Tillsyn",
  ];

  const rotKategorier = [
    "Bygg – reparera och underhålla",
    "Bygg – bygga om och bygga till",
    "El",
    "Glas och plåt",
    "Gräv- och markarbete",
    "Murning och sotning",
    "Målning och tapetsering",
    "Rengöring",
    "VVS",
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    let finalValue: string | boolean = value;

    if (e.target instanceof HTMLInputElement && e.target.type === "checkbox") {
      finalValue = e.target.checked;
    }

    if (name === "rotRutAktiverat" && finalValue === false) {
      setFormData((prev) => ({
        ...prev,
        rotRutAktiverat: false,
        rotRutTyp: undefined,
        rotRutKategori: undefined,
        avdragProcent: undefined,
        arbetskostnadExMoms: undefined,
        avdragBelopp: undefined,
        personnummer: undefined,
        fastighetsbeteckning: undefined,
        rotBoendeTyp: undefined,
        brfOrganisationsnummer: undefined,
        brfLagenhetsnummer: undefined,
      }));
      return;
    }

    if (name === "rotRutTyp") {
      const procent = value === "ROT" ? 30 : value === "RUT" ? 50 : undefined;
      setFormData((prev) => ({
        ...prev,
        rotRutTyp: value === "ROT" || value === "RUT" ? value : undefined,
        avdragProcent: procent,
        rotRutKategori: undefined,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: finalValue,
    }));
  };

  // Automatisk beräkning av avdragBelopp
  useEffect(() => {
    if (
      formData.rotRutAktiverat &&
      formData.arbetskostnadExMoms &&
      formData.avdragProcent !== undefined
    ) {
      const arbetskostnad =
        typeof formData.arbetskostnadExMoms === "string"
          ? parseFloat(formData.arbetskostnadExMoms)
          : formData.arbetskostnadExMoms;

      // Hämta momssats från första tjänsteartikel, annars 25%
      let moms = 25;
      const tjänsteArtiklar = artiklar.filter((a) => a.typ === "tjänst");
      if (tjänsteArtiklar.length > 0 && tjänsteArtiklar[0].moms !== undefined) {
        moms = Number(tjänsteArtiklar[0].moms);
      }

      // Räkna ut arbetskostnad inkl moms
      const arbetskostnadInklMoms = arbetskostnad * (1 + moms / 100);
      const belopp = arbetskostnadInklMoms * (formData.avdragProcent / 100);

      setFormData((prev) => ({
        ...prev,
        avdragBelopp: Math.round(belopp * 100) / 100,
      }));
    }
  }, [
    formData.arbetskostnadExMoms,
    formData.avdragProcent,
    formData.rotRutAktiverat,
    artiklar,
    setFormData,
  ]);

  // Automatisk ifyllning av arbetskostnad från nyArtikel eller artikel
  useEffect(() => {
    if (formData.rotRutAktiverat) {
      let arbetskostnad: number | undefined = undefined;

      if (
        nyArtikel.typ === "tjänst" &&
        nyArtikel.beskrivning &&
        parseFloat(nyArtikel.prisPerEnhet) > 0
      ) {
        arbetskostnad = parseFloat(nyArtikel.antal) * parseFloat(nyArtikel.prisPerEnhet);
      } else {
        const tjänsteArtiklar = artiklar.filter((a) => a.typ === "tjänst");
        if (tjänsteArtiklar.length === 1) {
          const art = tjänsteArtiklar[0];
          arbetskostnad = parseFloat(String(art.antal)) * parseFloat(String(art.prisPerEnhet));
        }
      }

      if (arbetskostnad !== undefined) {
        setFormData((prev) => ({
          ...prev,
          arbetskostnadExMoms: arbetskostnad,
        }));
      }
    }
  }, [formData.rotRutAktiverat, artiklar, nyArtikel, setFormData]);

  return (
    <div className="space-y-4 p-4 bg-slate-800 rounded-lg">
      {formData.rotRutAktiverat && (
        <>
          {/* ROT infotext */}
          {formData.rotRutTyp === "ROT" && (
            <div className="bg-yellow-100 text-yellow-900 rounded px-4 py-2 mb-2 text-sm">
              <strong>OBS!</strong> Bara arbetskostnaden (inkl. moms) får ligga till grund för
              ROT-avdrag. För andra kostnader såsom materialkostnad, skapa en ny artikel utan
              ROT-avdrag.
            </div>
          )}

          <div className="text-white">
            <label className="block mb-1">Typ av avdrag</label>
            <select
              name="rotRutTyp"
              value={formData.rotRutTyp ?? ""}
              onChange={handleChange}
              className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white"
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
                onChange={handleChange}
                className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white"
              >
                <option value="">Välj kategori</option>
                {(formData.rotRutTyp === "ROT" ? rotKategorier : rutKategorier).map((kategori) => (
                  <option key={kategori} value={kategori}>
                    {kategori}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Två kolumner för alla fält */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextFält
              label="Arbetskostnad exkl. moms"
              name="arbetskostnadExMoms"
              type="number"
              value={formData.arbetskostnadExMoms ?? ""}
              onChange={handleChange}
              required={true}
            />

            {formData.rotRutTyp === "ROT" && (
              <TextFält
                label="Personnummer (den som får avdraget)"
                name="personnummer"
                type="text"
                value={formData.personnummer ?? ""}
                onChange={handleChange}
                required={true}
              />
            )}

            {/* Fastighetsbeteckning eller BRF */}
            {formData.rotRutTyp === "ROT" && (
              <div className="md:col-span-2">
                <label className="block text-white font-semibold mb-1">Typ av boende</label>
                <div className="flex gap-4 mb-2">
                  <label className="flex items-center text-white">
                    <input
                      type="radio"
                      name="rotBoendeTyp"
                      value="fastighet"
                      checked={formData.rotBoendeTyp !== "brf"}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          rotBoendeTyp: "fastighet",
                          fastighetsbeteckning: "",
                          brfOrganisationsnummer: "",
                          brfLagenhetsnummer: "",
                        }))
                      }
                      className="mr-2"
                    />
                    Fastighetsbeteckning
                  </label>
                  <label className="flex items-center text-white">
                    <input
                      type="radio"
                      name="rotBoendeTyp"
                      value="brf"
                      checked={formData.rotBoendeTyp === "brf"}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          rotBoendeTyp: "brf",
                          fastighetsbeteckning: "",
                          brfOrganisationsnummer: "",
                          brfLagenhetsnummer: "",
                        }))
                      }
                      className="mr-2"
                    />
                    Bostadsrättsförening
                  </label>
                </div>
                {/* Fastighetsbeteckning */}
                {formData.rotBoendeTyp !== "brf" && (
                  <TextFält
                    label="Fastighetsbeteckning"
                    name="fastighetsbeteckning"
                    type="text"
                    value={formData.fastighetsbeteckning ?? ""}
                    onChange={handleChange}
                    required={true}
                  />
                )}
                {/* Bostadsrättsförening */}
                {formData.rotBoendeTyp === "brf" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextFält
                      label="Organisationsnummer (BRF)"
                      name="brfOrganisationsnummer"
                      type="text"
                      value={formData.brfOrganisationsnummer ?? ""}
                      onChange={handleChange}
                      required={true}
                    />
                    <TextFält
                      label="Lägenhetsnummer"
                      name="brfLagenhetsnummer"
                      type="text"
                      value={formData.brfLagenhetsnummer ?? ""}
                      onChange={handleChange}
                      required={true}
                    />
                  </div>
                )}
              </div>
            )}

            {/* RUT har inga extra fält */}
          </div>

          {formData.avdragBelopp !== undefined && (
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
