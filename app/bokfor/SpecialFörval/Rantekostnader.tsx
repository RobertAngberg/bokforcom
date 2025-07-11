// #region Huvud
"use client";

import { useState } from "react";
import LaddaUppFil from "../LaddaUppFil";
import Forhandsgranskning from "../Lonespecar/Forhandsgranskning/Forhandsgranskning";
import TextFält from "../../_components/TextFält";
import KnappFullWidth from "../../_components/KnappFullWidth";
import DatePicker from "react-datepicker";
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
  setExtrafält?: (val: Record<string, { label: string; debet: number; kredit: number }>) => void;
}
// #endregion

export default function Rantekostnader({
  mode,
  belopp,
  setBelopp,
  transaktionsdatum,
  setTransaktionsdatum,
  kommentar,
  setKommentar,
  setCurrentStep,
  fil,
  setFil,
  pdfUrl,
  setPdfUrl,
  extrafält,
  setExtrafält,
}: Props) {
  const [amortering, setAmortering] = useState(0);
  const giltigt = !!belopp && !!transaktionsdatum;

  function gåTillSteg3() {
    const total = belopp ?? 0;

    const extrafaltObj = {
      "1930": { label: "Företagskonto / affärskonto", debet: 0, kredit: total },
      "2310": { label: "Obligations- och förlagslån", debet: amortering, kredit: 0 },
      "8410": {
        label: "Räntekostnader för långfristiga skulder",
        debet: total - amortering,
        kredit: 0,
      },
    };

    setExtrafält?.(extrafaltObj);
    setCurrentStep?.(3);
  }

  if (mode === "steg2") {
    return (
      <>
        <div className="max-w-5xl mx-auto px-4 relative">
          <BakåtPil onClick={() => setCurrentStep?.(1)} />

          <h1 className="mb-6 text-3xl text-center">Steg 2: Räntekostnader</h1>
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
                label="Totalt belopp (ränta + amortering)"
                name="total"
                value={belopp ?? 0}
                onChange={(e) => setBelopp(Number(e.target.value))}
              />

              <TextFält
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
                selected={transaktionsdatum ? new Date(transaktionsdatum) : null}
                onChange={(d) => setTransaktionsdatum(d ? d.toISOString().split("T")[0] : "")}
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
          <BakåtPil onClick={() => setCurrentStep?.(2)} />
          <Steg3
            kontonummer="8410"
            kontobeskrivning="Räntekostnader"
            belopp={belopp ?? 0}
            transaktionsdatum={transaktionsdatum ?? ""}
            kommentar={kommentar ?? ""}
            valtFörval={{
              id: 0,
              namn: "Räntekostnader",
              beskrivning: "",
              typ: "",
              kategori: "",
              konton: [],
              momssats: 0,
              specialtyp: "rantekostnader",
            }}
            setCurrentStep={setCurrentStep}
            extrafält={extrafält}
          />
        </div>
      </>
    );
  }
}
