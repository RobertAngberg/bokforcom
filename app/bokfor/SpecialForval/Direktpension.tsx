// #region Huvud
"use client";

import LaddaUppFil from "../LaddaUppFil";
import Forhandsgranskning from "../Forhandsgranskning";
import TextFalt from "../../_components/TextFalt";
import Knapp from "../../_components/Knapp";
import DatePicker from "react-datepicker";
import Steg3 from "../Steg3";
import { ÅÅÅÅMMDDTillDate, dateTillÅÅÅÅMMDD } from "../../_utils/trueDatum";
import TillbakaPil from "../../_components/TillbakaPil";

interface Props {
  mode: "steg2" | "steg3";
  belopp?: number | null;
  setBelopp: (val: number | null) => void;
  transaktionsdatum?: string | null;
  setTransaktionsdatum: (val: string) => void;
  kommentar?: string | null;
  setKommentar?: (val: string | null) => void;
  setCurrentStep?: (val: number) => void;
  fil: File | null;
  setFil: (val: File | null) => void;
  pdfUrl: string | null;
  setPdfUrl: (val: string) => void;
  extrafält: Record<string, { label: string; debet: number; kredit: number }>;
  setExtrafält?: (val: Record<string, { label: string; debet: number; kredit: number }>) => void;
}
// #endregion

export default function Direktpension({
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
}: Props) {
  const giltigt = !!belopp && !!transaktionsdatum;

  function gåTillSteg3() {
    const total = belopp ?? 0;

    const extrafältObj = {
      "1385": { label: "Värde av kapitalförsäkring", debet: total, kredit: 0 },
      "1930": { label: "Företagskonto / affärskonto", debet: 0, kredit: total },
      "2230": {
        label: "Övriga avsättningar för pensioner och liknande förpliktelser",
        debet: 0,
        kredit: total,
      },
      "7421": { label: "Direktpension, ej avdragsgill", debet: total, kredit: 0 },
    };

    setExtrafält?.(extrafältObj);
    setCurrentStep?.(3);
  }

  if (mode === "steg2") {
    return (
      <>
        <div className="max-w-5xl mx-auto px-4 relative">
          <TillbakaPil onClick={() => setCurrentStep?.(1)} />

          <h1 className="mb-6 text-3xl text-center">Steg 2; Direktpension</h1>
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
                label="Totalt belopp"
                name="belopp"
                value={belopp ?? ""}
                onChange={(e) => setBelopp(Number(e.target.value))}
                required
              />

              <label className="block text-sm font-medium text-white mb-2">Betaldatum</label>
              <DatePicker
                className="w-full p-2 mb-4 rounded bg-slate-900 text-white border border-gray-700"
                selected={ÅÅÅÅMMDDTillDate(transaktionsdatum ?? "")}
                onChange={(date) => setTransaktionsdatum(dateTillÅÅÅÅMMDD(date))}
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

              <Knapp fullWidth text="Gå vidare" onClick={gåTillSteg3} disabled={!giltigt} />
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
            kontonummer="1385"
            kontobeskrivning="Direktpension"
            belopp={belopp ?? 0}
            transaktionsdatum={transaktionsdatum ?? ""}
            kommentar={kommentar ?? ""}
            valtFörval={{
              id: 0,
              namn: "Direktpension",
              beskrivning: "",
              typ: "",
              kategori: "",
              konton: [],
              momssats: 0,
              specialtyp: "direktpension",
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
