// #region Huvud
"use client";

import LaddaUppFil from "../LaddaUppFil";
import Forhandsgranskning from "../Forhandsgranskning";
import TextFalt from "../../_components/TextFalt";
import Knapp from "../../_components/Knapp";
import DatePicker from "react-datepicker";
import Steg3 from "../Steg3";
import TillbakaPil from "../../_components/TillbakaPil";
import { datePickerValue, datePickerOnChange } from "../../_utils/trueDatum";

interface Props {
  mode: "steg2" | "steg3";
  belopp?: number | null;
  setBelopp: (v: number | null) => void;
  transaktionsdatum?: string | null;
  setTransaktionsdatum: (v: string) => void;
  kommentar?: string | null;
  setKommentar?: (v: string | null) => void;
  setCurrentStep?: (v: number) => void;
  fil: File | null;
  setFil: (f: File | null) => void;
  pdfUrl: string | null;
  setPdfUrl: (u: string) => void;
  extrafält: Record<string, { label: string; debet: number; kredit: number }>;
  setExtrafält?: (f: Record<string, { label: string; debet: number; kredit: number }>) => void;
  formRef?: React.RefObject<HTMLFormElement>;
  handleSubmit?: (fd: FormData) => void;
}
// #endregion

export default function AvgifterAvrakningsnotaMoms({
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
  const momsSats = 0.25;
  const giltigt = !!belopp && !!transaktionsdatum;

  function gåTillSteg3() {
    const total = belopp ?? 0;
    const moms = (total * momsSats) / (1 + momsSats);
    const netto = total - moms;

    const extrafältObj = {
      "6064": { label: "Factoringavgifter", debet: netto, kredit: 0 },
      "2640": { label: "Ingående moms", debet: moms, kredit: 0 },
      "1930": { label: "Företagskonto / affärskonto", debet: 0, kredit: total },
    };

    setExtrafält?.(extrafältObj);
    setCurrentStep?.(3);
  }

  if (mode === "steg2") {
    return (
      <>
        <div className="max-w-5xl mx-auto px-4 relative">
          <TillbakaPil onClick={() => setCurrentStep?.(1)} />

          <h1 className="mb-6 text-3xl text-center">Steg 2: Avgifter avräkningsnota 25% moms</h1>
          <div className="flex flex-col-reverse justify-between md:flex-row">
            <div className="w-full mb-10 md:w-[40%] bg-slate-900 border border-gray-700 rounded-xl p-6">
              <LaddaUppFil
                fil={fil}
                setFil={setFil}
                setPdfUrl={setPdfUrl}
                setBelopp={setBelopp}
                setTransaktionsdatum={setTransaktionsdatum}
              />

              <TextFalt
                label="Totalbelopp (inkl. moms)"
                name="brutto"
                value={belopp ?? ""}
                onChange={(e) => setBelopp(Number(e.target.value))}
                required
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

              <Knapp fullWidth
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
            kontonummer="6064"
            kontobeskrivning="Avgifter avräkningsnota 25 % moms"
            belopp={belopp ?? 0}
            transaktionsdatum={transaktionsdatum ?? ""}
            kommentar={kommentar ?? ""}
            valtFörval={{
              id: 0,
              namn: "Avgifter avräkningsnota 25 % moms",
              beskrivning: "",
              typ: "",
              kategori: "",
              konton: [],
              momssats: 0.25,
              specialtyp: "avgifteravrakningsnota",
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
