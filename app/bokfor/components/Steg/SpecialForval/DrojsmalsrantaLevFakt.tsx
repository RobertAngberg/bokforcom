"use client";

import LaddaUppFil from "../LaddaUppFil";
import Forhandsgranskning from "../Forhandsgranskning";
import TextFalt from "../../../../_components/TextFalt";
import Knapp from "../../../../_components/Knapp";
import DatePicker from "react-datepicker";
import Steg3 from "../Steg3";
import { ÅÅÅÅMMDDTillDate, dateTillÅÅÅÅMMDD } from "../../../../_utils/datum";
import TillbakaPil from "../../../../_components/TillbakaPil";
import { useBokforContext } from "../../../context/BokforContextProvider";

export default function DrojsmalsrantaLevFakt({ mode }: { mode: "steg2" | "steg3" }) {
  const { state, actions } = useBokforContext();
  const giltigt = !!state.belopp && !!state.transaktionsdatum;

  function gåTillSteg3() {
    const total = state.belopp ?? 0;

    const extrafältObj = {
      "8422": { label: "Dröjsmålsräntor för leverantörsskulder", debet: total, kredit: 0 },
      "1930": { label: "Företagskonto", debet: 0, kredit: total },
    };

    actions.setExtrafält?.(extrafältObj);
    actions.setCurrentStep?.(3);
  }

  if (mode === "steg2") {
    return (
      <>
        <div className="max-w-5xl mx-auto px-4 relative">
          <TillbakaPil onClick={() => actions.setCurrentStep?.(1)} />

          <h1 className="mb-6 text-3xl text-center">Steg 2: Dröjsmålsränta Leverantörsfaktura</h1>
          <div className="flex flex-col-reverse justify-between max-w-5xl mx-auto px-4 md:flex-row">
            <div className="w-full md:w-[40%] bg-slate-900 border border-gray-700 rounded-xl p-6">
              <LaddaUppFil
                fil={state.fil}
                setFil={actions.setFil}
                setPdfUrl={actions.setPdfUrl}
                setTransaktionsdatum={actions.setTransaktionsdatum}
                setBelopp={actions.setBelopp}
              />

              <TextFalt
                label="Belopp (dröjsmålsränta)"
                name="belopp"
                value={state.belopp ?? ""}
                onChange={(e) => actions.setBelopp(Number(e.target.value))}
                required
              />

              <label className="block text-sm font-medium text-white mb-2">Betaldatum</label>
              <DatePicker
                className="w-full p-2 mb-4 rounded bg-slate-900 text-white border border-gray-700"
                selected={
                  state.transaktionsdatum ? ÅÅÅÅMMDDTillDate(state.transaktionsdatum) : null
                } // ✅ FIXA: Hantera tom sträng
                onChange={(d) => actions.setTransaktionsdatum(dateTillÅÅÅÅMMDD(d))}
                dateFormat="yyyy-MM-dd"
                locale="sv"
                placeholderText="Välj datum" // ✅ Placeholder
                required
              />

              <TextFalt
                label="Kommentar"
                name="kommentar"
                value={state.kommentar ?? ""}
                onChange={(e) => actions.setKommentar?.(e.target.value)}
                required={false}
              />

              <Knapp fullWidth text="Bokför" onClick={gåTillSteg3} disabled={!giltigt} />
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
}
