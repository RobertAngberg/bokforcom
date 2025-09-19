"use client";

import { useState } from "react";
import LaddaUppFil from "../Steg/LaddaUppFil";
import Forhandsgranskning from "../Steg/Forhandsgranskning";
import TextFalt from "../../../_components/TextFalt";
import Knapp from "../../../_components/Knapp";
import DatePicker from "react-datepicker";
import Steg3 from "../Steg/Steg3";
import TillbakaPil from "../../../_components/TillbakaPil";
import { datePickerValue, datePickerOnChange } from "../../../_utils/datum";
import { useBokforContext } from "../BokforProvider";
import { RantekostnaderProps } from "../../_types/types";

export default function Rantekostnader({ mode, renderMode }: RantekostnaderProps) {
  const { state, actions } = useBokforContext();
  const [amortering, setAmortering] = useState(0);
  const giltigt = !!state.belopp && !!state.transaktionsdatum;

  function gåTillSteg3() {
    const total = state.belopp ?? 0;

    const extrafaltObj = {
      "1930": { label: "Företagskonto / affärskonto", debet: 0, kredit: total },
      "2310": { label: "Obligations- och förlagslån", debet: amortering, kredit: 0 },
      "8410": {
        label: "Räntekostnader för långfristiga skulder",
        debet: total - amortering,
        kredit: 0,
      },
    };

    actions.setExtrafält(extrafaltObj);
    actions.setCurrentStep(3);
  }

  if (mode === "steg2") {
    return (
      <>
        <div className="max-w-5xl mx-auto px-4 relative">
          <TillbakaPil onClick={() => actions.setCurrentStep(1)} />

          <h1 className="mb-6 text-3xl text-center">Steg 2: Räntekostnader</h1>
          <div className="flex flex-col-reverse justify-between max-w-5xl mx-auto md:flex-row px-4">
            <div className="w-full mb-10 md:w-[40%] bg-slate-900 border border-gray-700 rounded-xl p-6">
              <LaddaUppFil
                fil={state.fil}
                setFil={actions.setFil}
                setPdfUrl={actions.setPdfUrl}
                setTransaktionsdatum={actions.setTransaktionsdatum}
                setBelopp={actions.setBelopp}
              />

              <TextFalt
                label="Totalt belopp (ränta + amortering)"
                name="total"
                value={state.belopp ?? 0}
                onChange={(e) => actions.setBelopp(Number(e.target.value))}
              />

              <TextFalt
                label="Varav amortering"
                name="amortering"
                value={amortering}
                onChange={(e) => setAmortering(Number(e.target.value))}
              />

              <label className="block text-sm font-medium text-white mb-2">
                Betaldatum (ÅÅÅÅ‑MM‑DD)
              </label>
              <DatePicker
                className="w-full p-2 mb-4 rounded text-white bg-slate-900 border border-gray-700"
                selected={datePickerValue(state.transaktionsdatum)}
                onChange={(d) => actions.setTransaktionsdatum(datePickerOnChange(d))}
                dateFormat="yyyy-MM-dd"
                locale="sv"
                required
              />

              <TextFalt
                label="Kommentar"
                name="kommentar"
                value=""
                onChange={(e) => {
                  /* TODO: Lägg till kommentar i store */
                }}
                required={false}
              />

              <Knapp
                fullWidth
                text="Bokför"
                type="button"
                onClick={gåTillSteg3}
                disabled={!giltigt}
              />
            </div>
            <Forhandsgranskning fil={state.fil ?? null} pdfUrl={state.pdfUrl ?? null} />
          </div>
        </div>
      </>
    );
  }

  if (mode === "steg3") {
    return (
      <>
        <div className="max-w-5xl mx-auto px-4 relative">
          <TillbakaPil onClick={() => actions.setCurrentStep(2)} />
          <Steg3 />
        </div>
      </>
    );
  }
}
