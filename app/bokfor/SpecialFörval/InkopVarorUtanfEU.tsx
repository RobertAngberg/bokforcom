// #region Huvud
"use client";

import LaddaUppFil from "../LaddaUppFil";
import Forhandsgranskning from "../Förhandsgranskning";
import TextFält from "../../_components/TextFält";
import KnappFullWidth from "../../_components/KnappFullWidth";
import DatePicker from "react-datepicker";
import { ÅÅÅÅMMDDTillDate, dateTillÅÅÅÅMMDD } from "../../_utils/datum";
import Steg3 from "../Steg3";
import BakåtPil from "../../_components/BakåtPil";

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
  setExtrafält?: (fält: Record<string, { label: string; debet: number; kredit: number }>) => void;
}
// #endregion

export default function InkopVarorUtanfEU({
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
    const extrafältObj = {
      "1930": { label: "Företagskonto / affärskonto", debet: 0, kredit: belopp ?? 0 },
      "4000": { label: "Inköp material och varor", debet: belopp ?? 0, kredit: 0 },
      "4500": { label: "Inköp utanför Sverige", debet: belopp ?? 0, kredit: 0 },
      "4598": { label: "Justering, omvänd moms", debet: 0, kredit: belopp ?? 0 },
    };

    setExtrafält?.(extrafältObj);
    setCurrentStep?.(3);
  }

  if (mode === "steg2") {
    return (
      <>
        <div className="max-w-5xl mx-auto px-4 relative">
          <BakåtPil onClick={() => setCurrentStep?.(1)} />

          <h1 className="mb-6 text-3xl text-center">Steg 2: Inköp varor utanför EU</h1>
          <div className="flex flex-col-reverse justify-between max-w-5xl mx-auto md:flex-row px-4">
            <div className="w-full mb-10 md:w-[40%] bg-slate-900 border border-gray-700 rounded-xl p-6">
              <LaddaUppFil
                fil={fil}
                setFil={setFil}
                setPdfUrl={setPdfUrl}
                setTransaktionsdatum={setTransaktionsdatum}
                setBelopp={setBelopp}
              />

              <TextFält
                label="Totalt belopp"
                name="belopp"
                value={belopp ?? ""}
                onChange={(e) => setBelopp(Number(e.target.value))}
                required
              />

              <label className="block text-sm font-medium text-white mb-2">Betaldatum</label>
              <DatePicker
                className="w-full p-2 mb-4 rounded text-white bg-slate-900 border border-gray-700"
                selected={ÅÅÅÅMMDDTillDate(transaktionsdatum ?? "")}
                onChange={(date) => setTransaktionsdatum(dateTillÅÅÅÅMMDD(date))}
                dateFormat="yyyy-MM-dd"
                locale="sv"
                required
              />

              <TextFält
                label="Kommentar"
                name="kommentar"
                value={kommentar ?? ""}
                onChange={(e) => setKommentar?.(e.target.value)}
                required={false}
              />

              <KnappFullWidth
                text="Bokför"
                type="button"
                onClick={gåTillSteg3}
                disabled={!giltigt}
              />
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
          <BakåtPil onClick={() => setCurrentStep?.(2)} />
          <Steg3
            kontonummer="4500"
            kontobeskrivning="Inköp varor utanför EU"
            belopp={belopp ?? 0}
            transaktionsdatum={transaktionsdatum ?? ""}
            kommentar={kommentar ?? ""}
            valtFörval={{
              id: 0,
              namn: "Inköp varor utanför EU",
              beskrivning: "",
              typ: "",
              kategori: "",
              konton: [],
              momssats: 0,
              specialtyp: "inkopvarorutanfEU",
            }}
            setCurrentStep={setCurrentStep}
            extrafält={extrafält}
          />
        </div>
      </>
    );
  }
}
