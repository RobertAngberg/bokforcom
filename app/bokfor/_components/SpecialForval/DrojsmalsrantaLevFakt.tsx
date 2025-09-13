// #region Huvud
"use client";

import LaddaUppFil from "../Steg/LaddaUppFil";
import Forhandsgranskning from "../Steg/Forhandsgranskning";
import TextFalt from "../../../_components/TextFalt";
import Knapp from "../../../_components/Knapp";
import DatePicker from "react-datepicker";
import Steg3 from "../Steg/Steg3";
import { ÅÅÅÅMMDDTillDate, dateTillÅÅÅÅMMDD } from "../../../_utils/trueDatum";
import TillbakaPil from "../../../_components/TillbakaPil";
import { DrojsmalsrantaLevFaktProps } from "../../_types/types";
// #endregion

export default function DrojsmalsrantaLevFakt({
  mode,
  belopp = null,
  setBelopp,
  transaktionsdatum = "",
  setTransaktionsdatum,
  kommentar = "",
  setKommentar,
  setCurrentStep,
  fil,
  setFil,
  pdfUrl,
  setPdfUrl,
  extrafält,
  setExtrafält,
}: DrojsmalsrantaLevFaktProps) {
  const giltigt = !!belopp && !!transaktionsdatum;

  function gåTillSteg3() {
    const total = belopp ?? 0;

    const extrafältObj = {
      "8422": { label: "Dröjsmålsräntor för leverantörsskulder", debet: total, kredit: 0 },
      "1930": { label: "Företagskonto", debet: 0, kredit: total },
    };

    setExtrafält?.(extrafältObj);
    setCurrentStep?.(3);
  }

  if (mode === "steg2") {
    return (
      <>
        <div className="max-w-5xl mx-auto px-4 relative">
          <TillbakaPil onClick={() => setCurrentStep?.(1)} />

          <h1 className="mb-6 text-3xl text-center">Steg 2: Dröjsmålsränta Leverantörsfaktura</h1>
          <div className="flex flex-col-reverse justify-between max-w-5xl mx-auto px-4 md:flex-row">
            <div className="w-full md:w-[40%] bg-slate-900 border border-gray-700 rounded-xl p-6">
              <LaddaUppFil
                fil={fil}
                setFil={setFil}
                setPdfUrl={setPdfUrl}
                setTransaktionsdatum={setTransaktionsdatum}
                setBelopp={setBelopp}
              />

              <TextFalt
                label="Belopp (dröjsmålsränta)"
                name="belopp"
                value={belopp ?? ""}
                onChange={(e) => setBelopp(Number(e.target.value))}
                required
              />

              <label className="block text-sm font-medium text-white mb-2">Betaldatum</label>
              <DatePicker
                className="w-full p-2 mb-4 rounded bg-slate-900 text-white border border-gray-700"
                selected={transaktionsdatum ? ÅÅÅÅMMDDTillDate(transaktionsdatum) : null} // ✅ FIXA: Hantera tom sträng
                onChange={(d) => setTransaktionsdatum(dateTillÅÅÅÅMMDD(d))}
                dateFormat="yyyy-MM-dd"
                locale="sv"
                placeholderText="Välj datum" // ✅ Placeholder
                required
              />

              <TextFalt
                label="Kommentar"
                name="kommentar"
                value={kommentar ?? ""}
                onChange={(e) => setKommentar?.(e.target.value)}
                required={false}
              />

              <Knapp fullWidth text="Bokför" onClick={gåTillSteg3} disabled={!giltigt} />
            </div>

            <Forhandsgranskning fil={fil} pdfUrl={pdfUrl} />
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
            kontonummer="8422"
            kontobeskrivning="Dröjsmålsränta Leverantörsfaktura"
            belopp={belopp ?? 0}
            transaktionsdatum={transaktionsdatum ?? ""}
            kommentar={kommentar ?? ""}
            valtFörval={{
              id: 0,
              namn: "Dröjsmålsränta Leverantörsfaktura",
              beskrivning: "",
              typ: "",
              kategori: "",
              konton: [],
              momssats: 0,
              specialtyp: "drojsmalsranta",
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
