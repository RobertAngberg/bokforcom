"use client";

import { useState } from "react";
import LaddaUppFil from "../LaddaUppFil";
import TextFalt from "../../../../_components/TextFalt";
import Knapp from "../../../../_components/Knapp";
import DatePicker from "react-datepicker";
import Steg3 from "../Steg3";
import TillbakaPil from "../../../../_components/TillbakaPil";
import { datePickerValue, datePickerOnChange } from "../../../../_utils/datum";
import Forhandsgranskning from "../Forhandsgranskning";
import { useBokforContext } from "../../BokforProvider";
import { AmorteringBanklanProps } from "../../../types/types";

export default function AmorteringBanklan({ mode }: Pick<AmorteringBanklanProps, "mode">) {
  const { state, actions } = useBokforContext();
  const [ränta, setRänta] = useState(0);

  const giltigt = !!state.belopp && !!state.transaktionsdatum;

  function gåTillSteg3() {
    const total = state.belopp ?? 0;
    const interest = ränta;
    const amort = total - interest;

    const extrafältObj = {
      "1930": { label: "Företagskonto / affärskonto", debet: 0, kredit: total },
      "2350": {
        label: "Andra långfristiga skulder till kreditinstitut",
        debet: amort,
        kredit: 0,
      },
      "8410": { label: "Räntekostnader för långfristiga skulder", debet: interest, kredit: 0 },
    };

    actions.setExtrafält?.(extrafältObj);
    actions.setCurrentStep?.(3);
  }

  if (mode === "steg2") {
    return (
      <>
        <div className="max-w-5xl mx-auto px-4 relative">
          <TillbakaPil onClick={() => actions.setCurrentStep?.(1)} />

          <h1 className="mb-6 text-3xl text-center">Steg 2: Amortering av banklån</h1>
          <div className="flex flex-col-reverse justify-between md:flex-row">
            <div className="w-full mb-10 md:w-[40%] bg-slate-900 border border-gray-700 rounded-xl p-6">
              <LaddaUppFil
                fil={state.fil}
                setFil={actions.setFil}
                setPdfUrl={actions.setPdfUrl}
                setTransaktionsdatum={actions.setTransaktionsdatum}
                setBelopp={actions.setBelopp}
              />

              <TextFalt
                label="Amorteringsbelopp"
                name="amortering"
                value={state.belopp ?? 0}
                onChange={(e) => actions.setBelopp(Number(e.target.value))}
              />

              <TextFalt
                label="Varav räntekostnad"
                name="ränta"
                value={ränta}
                onChange={(e) => setRänta(Number(e.target.value))}
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
          <TillbakaPil onClick={() => actions.setCurrentStep?.(2)} />
          <Steg3
            kontonummer="2350"
            kontobeskrivning="Amortering av banklån"
            belopp={state.belopp ?? 0}
            transaktionsdatum={state.transaktionsdatum ?? ""}
            kommentar={state.kommentar ?? ""}
            valtFörval={{
              id: 0,
              namn: "Amortering av banklån",
              beskrivning: "",
              typ: "",
              kategori: "",
              konton: [],
              momssats: 0,
              specialtyp: "amorteringbanklan",
              sökord: [],
            }}
            setCurrentStep={actions.setCurrentStep}
            extrafält={state.extrafält}
          />
        </div>
      </>
    );
  }
}
