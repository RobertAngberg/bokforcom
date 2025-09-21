"use client";

import { useState } from "react";
import LaddaUppFil from "../LaddaUppFil";
import Forhandsgranskning from "../Forhandsgranskning";
import TextFalt from "../../../../_components/TextFalt";
import Knapp from "../../../../_components/Knapp";
import DatePicker from "react-datepicker";
import Steg3 from "../Steg3";
import TillbakaPil from "../../../../_components/TillbakaPil";
import { datePickerValue, datePickerOnChange } from "../../../../_utils/datum";
import { UberAvgiftProps } from "../../../types/types";

export default function UberAvgift({
  mode,
  belopp,
  setBelopp,
  setCurrentStep,
  fil,
  setFil,
  pdfUrl,
  setPdfUrl,
  transaktionsdatum,
  setTransaktionsdatum,
  kommentar,
  setKommentar,
  extrafält,
  setExtrafält,
}: UberAvgiftProps) {
  const [moms, setMoms] = useState(0);

  const giltigt = !!belopp && !!transaktionsdatum;

  function gåTillSteg3() {
    const total = belopp ?? 0;
    const moms = Number((total * 0.25).toFixed(2));
    setMoms(moms);

    const extrafältObj = {
      "1930": { label: "Företagskonto / affärskonto", debet: 0, kredit: total },
      "2614": {
        label: "Utgående moms omvänd skattskyldighet, 25 %",
        debet: 0,
        kredit: moms,
      },
      "2645": {
        label: "Beräknad ingående moms på förvärv från utlandet",
        debet: moms,
        kredit: 0,
      },
      "4535": {
        label: "Inköp av tjänster från annat EU-land, 25 %",
        debet: total,
        kredit: 0,
      },
    };

    setExtrafält?.(extrafältObj);
    setCurrentStep?.(3);
  }

  if (mode === "steg2") {
    return (
      <>
        <div className="max-w-5xl mx-auto px-4 relative">
          <TillbakaPil onClick={() => setCurrentStep?.(1)} />

          <h1 className="mb-6 text-3xl text-center">Steg 2: Uberavgift</h1>
          <div className="flex flex-col-reverse justify-between max-w-5xl mx-auto md:flex-row px-4">
            <div className="w-full mb-10 md:w-[40%] bg-slate-900 border border-gray-700 rounded-xl p-6">
              <LaddaUppFil
                fil={fil}
                setFil={setFil}
                setPdfUrl={setPdfUrl}
                setTransaktionsdatum={setTransaktionsdatum}
                setBelopp={setBelopp}
              />

              <TextFalt
                label="Summa Uber-avgift exkl moms"
                name="belopp"
                value={belopp ?? ""}
                onChange={(e) => setBelopp(Number(e.target.value))}
              />

              <label className="block text-sm font-medium text-white mb-2">
                Betaldatum (ÅÅÅÅ‑MM‑DD)
              </label>
              <DatePicker
                className="w-full p-2 mb-4 rounded text-white bg-slate-900 border border-gray-700"
                selected={datePickerValue(transaktionsdatum)}
                onChange={(d) => setTransaktionsdatum(datePickerOnChange(d))}
                dateFormat="yyyy-MM-dd"
                locale="sv"
                required
              />

              <TextFalt
                label="Kommentar"
                name="kommentar"
                value={kommentar ?? ""}
                onChange={(e) => setKommentar?.(e.target.value)}
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

            <Forhandsgranskning fil={fil ?? null} pdfUrl={pdfUrl ?? null} />
          </div>
        </div>
      </>
    );
  }

  if (mode === "steg3") {
    return (
      <>
        <div className="max-w-5xl mx-auto px-4 relative">
          <TillbakaPil onClick={() => setCurrentStep?.(2)} />
          <Steg3
            kontonummer="4535"
            kontobeskrivning="Uberavgift"
            belopp={belopp ?? 0}
            transaktionsdatum={transaktionsdatum ?? ""}
            kommentar={kommentar ?? ""}
            valtFörval={{
              id: 0,
              namn: "Uberavgift",
              beskrivning: "",
              typ: "",
              kategori: "",
              konton: [],
              momssats: 0.25,
              specialtyp: "uberavgift",
              sökord: [],
            }}
            setCurrentStep={setCurrentStep}
            extrafält={extrafält}
          />
        </div>
      </>
    );
  }
}
