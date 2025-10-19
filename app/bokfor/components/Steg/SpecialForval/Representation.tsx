"use client";

import { useState } from "react";
import Steg3 from "../Steg3";
import TillbakaPil from "../../../../_components/TillbakaPil";
import TextFalt from "../../../../_components/TextFalt";
import Knapp from "../../../../_components/Knapp";
import DatePicker from "react-datepicker";
import LaddaUppFil from "../LaddaUppFil";
import Forhandsgranskning from "../Forhandsgranskning";
import { datePickerValue, dateToYyyyMmDd } from "../../../../_utils/datum";
import { useBokforContext } from "../../../context/BokforContextProvider";
import { RepresentationProps, RepresentationsTypLocal } from "../../../types/types";
import { calculateRepresentation } from "../../../../_utils/representation";

export default function Representation({ mode, renderMode = "standard" }: RepresentationProps) {
  const { state, actions } = useBokforContext();

  const [antalPersoner, setAntalPersoner] = useState("");
  const [alkoholBelopp, setAlkoholBelopp] = useState("");
  const [representationstyp, setRepresentationstyp] =
    useState<RepresentationsTypLocal>("lunch_middag");

  // Använd totalt belopp för beräkningar
  const totalBelopp = state.belopp ?? 0;
  const antal = Number(antalPersoner) || 0;
  const alkoholBeloppTrim = alkoholBelopp.trim();
  const alkoholBeloppNum = alkoholBeloppTrim === "" ? 0 : Number(alkoholBeloppTrim);
  const alkoholÄrTal = alkoholBeloppTrim === "" || Number.isFinite(alkoholBeloppNum);
  const alkoholNegativ = alkoholÄrTal && alkoholBeloppNum < 0;
  const alkoholÖverstigerTotal = alkoholÄrTal && alkoholBeloppNum > totalBelopp;
  const giltigtAlkohol = alkoholÄrTal && !alkoholNegativ && !alkoholÖverstigerTotal;
  const alkoholFörBeräkning = alkoholÄrTal
    ? Math.min(Math.max(alkoholBeloppNum, 0), totalBelopp)
    : 0;
  const matBelopp = Math.max(totalBelopp - alkoholFörBeräkning, 0);

  const kalkyl = calculateRepresentation({
    totalAmount: totalBelopp,
    numberOfPeople: antal,
    foodAmountIncl: matBelopp,
    alcoholAmountIncl: alkoholFörBeräkning,
  });
  const schablonMoms = kalkyl.schablonMoms ?? null;
  const schablonÄrBättre = schablonMoms !== null && schablonMoms > kalkyl.momsAvdrag;

  // Olika valideringslogik beroende på renderMode
  const giltigt =
    renderMode === "levfakt"
      ? !!state.belopp &&
        !!state.transaktionsdatum &&
        !!state.leverantör &&
        !!state.fakturadatum &&
        antal > 0 &&
        giltigtAlkohol
      : !!state.belopp && !!state.transaktionsdatum && antal > 0 && giltigtAlkohol;

  function gåTillSteg3() {
    const momsAvdrag = kalkyl.momsAvdrag;
    const ejAvdragsgill = kalkyl.ejAvdragsgill;

    const extrafältObj: Record<string, { label: string; debet: number; kredit: number }> = {};
    const betalningskonto = renderMode === "levfakt" ? "2440" : "1930";

    extrafältObj[betalningskonto] = {
      label: renderMode === "levfakt" ? "Leverantörsskulder" : "Företagskonto / affärskonto",
      debet: 0,
      kredit: totalBelopp,
    };

    if (momsAvdrag > 0) {
      extrafältObj["2640"] = { label: "Ingående moms", debet: momsAvdrag, kredit: 0 };
    }

    if (ejAvdragsgill > 0) {
      extrafältObj["6072"] = {
        label: "Representation, ej avdragsgill",
        debet: ejAvdragsgill,
        kredit: 0,
      };
    }

    actions.setExtrafält(extrafältObj);
    actions.setCurrentStep(3);
  }

  if (mode === "steg2") {
    return (
      <>
        <div className="max-w-5xl mx-auto px-4 relative">
          <TillbakaPil onClick={() => actions.setCurrentStep(1)} />

          <h1 className="mb-6 text-3xl text-center text-white">Steg 2: Representation</h1>
          <div className="flex flex-col-reverse justify-between md:flex-row">
            <div className="w-full mb-10 md:w-[40%] bg-slate-900 border border-gray-700 rounded-xl p-6">
              <LaddaUppFil
                fil={state.fil}
                setFil={actions.setFil}
                setPdfUrl={actions.setPdfUrl}
                setBelopp={actions.setBelopp}
                setTransaktionsdatum={actions.setTransaktionsdatum}
              />

              <TextFalt
                label="Total kostnad inkl. moms"
                name="total"
                value={state.belopp ?? ""}
                onChange={(e) => actions.setBelopp(Number(e.target.value))}
                required
              />

              <TextFalt
                label="Alkoholdrycker inkl. moms (om tillämpligt)"
                name="alkohol"
                value={alkoholBelopp}
                onChange={(e) => setAlkoholBelopp(e.target.value)}
                placeholder="0"
              />
              {!alkoholÄrTal && alkoholBeloppTrim !== "" && (
                <p className="text-xs text-red-400 mb-2">Ange ett numeriskt belopp.</p>
              )}
              {alkoholNegativ && (
                <p className="text-xs text-red-400 mb-2">Beloppet kan inte vara negativt.</p>
              )}
              {alkoholÖverstigerTotal && (
                <p className="text-xs text-red-400 mb-2">
                  Alkoholkostnaden kan inte överstiga totalbeloppet.
                </p>
              )}

              <label className="block text-sm font-medium text-white mb-2">
                Betaldatum (ÅÅÅÅ‑MM‑DD)
              </label>
              <DatePicker
                className="w-full p-2 mb-4 rounded text-white bg-slate-900 border border-gray-700"
                selected={datePickerValue(state.transaktionsdatum)}
                onChange={(date) => {
                  const dateStr = date ? dateToYyyyMmDd(date) : "";
                  actions.setTransaktionsdatum(dateStr);
                }}
                locale="sv"
                placeholderText="Välj datum"
                dateFormat="yyyy-MM-dd"
              />

              {/* Representation-specifika fält */}
              <TextFalt
                label="Antal personer"
                name="antalPersoner"
                value={antalPersoner}
                onChange={(e) => setAntalPersoner(e.target.value)}
                placeholder="Ange antal personer"
                required
              />

              <label className="block text-sm font-medium text-white mb-2">
                Typ av representation
              </label>
              <select
                className="w-full p-2 mb-4 rounded text-white bg-slate-900 border border-gray-700"
                value={representationstyp}
                onChange={(e) => setRepresentationstyp(e.target.value as RepresentationsTypLocal)}
              >
                <option value="lunch_middag">Måltid</option>
                <option value="enklare_fortaring">Enklare förtäring</option>
              </select>

              <TextFalt
                label="Kommentar"
                name="kommentar"
                value={state.kommentar ?? ""}
                onChange={(e) => actions.setKommentar(e.target.value)}
                placeholder="Beskriv representationen..."
              />

              <div className="mb-4 rounded-lg border border-blue-700 bg-blue-900 p-4 text-xs text-blue-100">
                <p className="font-semibold text-blue-200">Dokumentera deltagare</p>
                <p className="mt-1">
                  Anteckna vilka som deltog på kvittot eller i kommentaren för att uppfylla
                  Skatteverkets krav.
                </p>
                <p className="mt-2 text-blue-300">
                  Avdraget för moms begränsas till 300 kr exkl. moms per person och tillfälle.
                  Alkohol räknas aldrig som enklare förtäring och omfattas av särskilda regler.
                </p>
              </div>

              {antal > 0 && totalBelopp > 0 && giltigtAlkohol && (
                <div className="mb-4 rounded-lg border border-slate-700 bg-slate-900 p-4 text-sm text-slate-200">
                  <p className="font-medium">Beräkning enligt Skatteverket</p>
                  <p>Mat och övrig dryck (inkl. moms): {matBelopp.toFixed(2)} kr</p>
                  <p>Alkoholdrycker (inkl. moms): {alkoholFörBeräkning.toFixed(2)} kr</p>
                  <p>Moms att dra av (proportion): {kalkyl.momsAvdrag.toFixed(2)} kr</p>
                  {schablonMoms !== null && (
                    <p>
                      Schablon 46 kr/person: {schablonMoms.toFixed(2)} kr
                      {schablonÄrBättre && " (högre)"}
                    </p>
                  )}
                  <p>Ej avdragsgill kostnad: {kalkyl.ejAvdragsgill.toFixed(2)} kr</p>
                  <p className="text-slate-400">
                    Gränsen är 300 kr exkl. moms per person för mat och dryck. Vi använder
                    proportionering så att resultatet matchar Skatteverkets räknesnurra. Schablonen
                    anges endast som referens om du vill räkna om manuellt.
                  </p>
                  {schablonÄrBättre && (
                    <p className="text-slate-400">
                      Vill du använda schablonvärdet behöver du justera beloppen manuellt i nästa
                      steg.
                    </p>
                  )}
                </div>
              )}

              <Knapp text="Gå vidare" onClick={gåTillSteg3} disabled={!giltigt} fullWidth />
            </div>
            <Forhandsgranskning fil={state.fil} pdfUrl={state.pdfUrl} />
          </div>
        </div>
      </>
    );
  }

  if (mode === "steg3") {
    return (
      <>
        <div className="max-w-5xl mx-auto px-4 relative">
          <Steg3 />
        </div>
      </>
    );
  }

  return null; // Fallback om inget mode matchar
}
