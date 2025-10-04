"use client";

import LaddaUppFil from "../LaddaUppFil";
import Forhandsgranskning from "../Forhandsgranskning";
import TextFalt from "../../../../_components/TextFalt";
import Knapp from "../../../../_components/Knapp";
import DatePicker from "react-datepicker";
import Steg3 from "../Steg3";
import TillbakaPil from "../../../../_components/TillbakaPil";
import { datePickerValue, datePickerOnChange } from "../../../../_utils/datum";
import { useBokforContext } from "../../../context/BokforContextProvider";
import { AvrakningsnotaUtanMomsProps } from "../../../types/types";

export default function AvrakningsnotaUtanMoms({
  mode,
}: Pick<AvrakningsnotaUtanMomsProps, "mode">) {
  const { state, actions } = useBokforContext();
  const giltigt = !!state.belopp && !!state.transaktionsdatum;

  function gåTillSteg3() {
    const total = state.belopp ?? 0;

    const extrafältObj = {
      "6570": { label: "Bankkostnader", debet: total, kredit: 0 },
      "1930": { label: "Företagskonto / affärskonto", debet: 0, kredit: total },
    };

    actions.setExtrafält?.(extrafältObj);
    actions.setCurrentStep?.(3);
  }

  if (mode === "steg2") {
    return (
      <>
        <div className="max-w-5xl mx-auto px-4 relative">
          <TillbakaPil onClick={() => actions.setCurrentStep?.(1)} />

          <h1 className="mb-6 text-3xl text-center">Steg 2: Avräkningsnota utan moms</h1>
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
                label="Belopp"
                name="belopp"
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
                onChange={(d) => actions.setTransaktionsdatum(datePickerOnChange(d))}
                dateFormat="yyyy-MM-dd"
                locale="sv"
                required
              />

              <TextFalt
                label="Kommentar"
                name="kommentar"
                value={state.kommentar ?? ""}
                onChange={(e) => actions.setKommentar?.(e.target.value)}
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
          <Steg3 />
        </div>
      </>
    );
  }
}
