"use client";

import { useState } from "react";
import Steg3 from "../Steg3";
import TillbakaPil from "../../../../_components/TillbakaPil";
import TextFalt from "../../../../_components/TextFalt";
import Knapp from "../../../../_components/Knapp";
import DatePicker from "react-datepicker";
import LaddaUppFil from "../LaddaUppFil";
import Forhandsgranskning from "../Forhandsgranskning";
import { datePickerValue } from "../../../../_utils/datum";
import { useBokforContext } from "../../../context/BokforContextProvider";
import { RepresentationProps, RepresentationsTypLocal } from "../../../types/types";

// Schablon beräkning enligt Skatteverket
function beräknaSchablon(antalPersoner: number, typ: RepresentationsTypLocal, totalBelopp: number) {
  // Bokio verkar använda samma beräkning för båda typerna
  const schablon = antalPersoner * 46; // kr per person för båda typerna

  // Avdragsgill del = minimum av faktisk kostnad och schablon
  const avdragsgillDel = Math.min(totalBelopp, schablon);
  const ejAvdragsgillDel = totalBelopp - avdragsgillDel;

  return {
    schablon,
    avdragsgillDel,
    ejAvdragsgillDel,
    procent: totalBelopp > 0 ? (avdragsgillDel / totalBelopp) * 100 : 0,
  };
}

export default function Representation({ mode, renderMode = "standard" }: RepresentationProps) {
  const { state, actions } = useBokforContext();

  const [antalPersoner, setAntalPersoner] = useState("");
  const [representationstyp, setRepresentationstyp] =
    useState<RepresentationsTypLocal>("maltid_alkohol");

  // Använd totalt belopp för beräkningar
  const totalBelopp = state.belopp ?? 0;

  // Olika valideringslogik beroende på renderMode
  const giltigt =
    renderMode === "levfakt"
      ? !!state.belopp && !!state.transaktionsdatum && !!state.leverantör && !!state.fakturadatum
      : !!state.belopp && !!state.transaktionsdatum;

  function gåTillSteg3() {
    // Beräkna schablon och bestäm avdragsgillhet
    const schablon = beräknaSchablon(parseInt(antalPersoner) || 1, representationstyp, totalBelopp);

    // Bokio-logik: Schablon på exkl-moms basis, sedan beräkna moms
    const exklMoms = totalBelopp / 1.25; // Totalt exkl moms
    const maxAvdragsgillExklMoms = Math.min(schablon.schablon, exklMoms); // Schablon begränsat till exkl moms
    const avdragsgillMomsbelopp = maxAvdragsgillExklMoms * 0.25; // 25% moms på avdragsgill del
    const kostnadEjAvdragsgill = totalBelopp - avdragsgillMomsbelopp; // Välj konto baserat på typ
    const konto = representationstyp === "enklare_fortaring" ? "6071" : "6072";
    const kontoBeskrivning =
      representationstyp === "enklare_fortaring"
        ? "Representation, avdragsgill"
        : "Representation, ej avdragsgill";

    if (renderMode === "levfakt") {
      // Leverantörsfaktura: Skuld mot leverantör
      const extrafältObj: Record<string, { label: string; debet: number; kredit: number }> = {
        "2440": { label: "Leverantörsskulder", debet: 0, kredit: totalBelopp },
        "2640": { label: "Ingående moms", debet: avdragsgillMomsbelopp, kredit: 0 },
        [konto]: { label: kontoBeskrivning, debet: kostnadEjAvdragsgill, kredit: 0 },
      };

      actions.setExtrafält(extrafältObj);
    } else {
      // Standard: Direkt betalning från företagskonto
      const extrafältObj: Record<string, { label: string; debet: number; kredit: number }> = {
        "1930": { label: "Företagskonto / affärskonto", debet: 0, kredit: totalBelopp },
        "2640": { label: "Ingående moms", debet: avdragsgillMomsbelopp, kredit: 0 },
        [konto]: { label: kontoBeskrivning, debet: kostnadEjAvdragsgill, kredit: 0 },
      };

      actions.setExtrafält(extrafältObj);
    }
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

              <label className="block text-sm font-medium text-white mb-2">
                Betaldatum (ÅÅÅÅ‑MM‑DD)
              </label>
              <DatePicker
                className="w-full p-2 mb-4 rounded text-white bg-slate-900 border border-gray-700"
                selected={datePickerValue(state.transaktionsdatum)}
                onChange={(date) => {
                  const dateStr = date ? date.toISOString().split("T")[0] : "";
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
                <option value="maltid_alkohol">Måltid med alkohol</option>
                <option value="enklare_fortaring">Enklare förtäring</option>
              </select>

              <TextFalt
                label="Kommentar"
                name="kommentar"
                value={state.kommentar ?? ""}
                onChange={(e) => actions.setKommentar(e.target.value)}
                placeholder="Beskriv representationen..."
              />

              <Knapp text="Gå vidare" onClick={gåTillSteg3} disabled={!giltigt} fullWidth />
            </div>
            <Forhandsgranskning fil={state.fil} pdfUrl={state.pdfUrl} />
          </div>
        </div>

        {/* Info om representation */}
        <div className="max-w-5xl mx-auto px-4 mt-6">
          <div className="bg-blue-900 border border-blue-700 rounded-xl p-4 flex items-start space-x-3">
            <svg
              className="w-6 h-6 text-blue-300 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-blue-100">
                <strong>Dokumentera deltagare:</strong> Anteckna vilka som deltog på kvittot eller i
                kommentaren för att uppfylla Skatteverkets krav.
              </p>
            </div>
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
