// #region
"use client";

import { useState } from "react";
import LaddaUppFil from "../LaddaUppFil";
import TextFält from "../../_components/TextFält";
import KnappFullWidth from "../../_components/KnappFullWidth";
import DatePicker from "react-datepicker";
import Steg3 from "../Steg3";
import BakåtPil from "../../_components/BakåtPil";
import Forhandsgranskning from "../Forhandsgranskning";

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

export default function AmorteringBanklan({
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
}: Props) {
  const [ränta, setRänta] = useState(0);

  const giltigt = !!belopp && !!transaktionsdatum;

  function gåTillSteg3() {
    const total = belopp ?? 0;
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

    setExtrafält?.(extrafältObj);
    setCurrentStep?.(3);
  }

  if (mode === "steg2") {
    return (
      <>
        <div className="max-w-5xl mx-auto px-4 relative">
          <BakåtPil onClick={() => setCurrentStep?.(1)} />

          <h1 className="mb-6 text-3xl text-center">Steg 2: Amortering av banklån</h1>
          <div className="flex flex-col-reverse justify-between md:flex-row">
            <div className="w-full mb-10 md:w-[40%] bg-slate-900 border border-gray-700 rounded-xl p-6">
              <LaddaUppFil
                fil={fil}
                setFil={setFil}
                setPdfUrl={setPdfUrl}
                setTransaktionsdatum={setTransaktionsdatum}
                setBelopp={setBelopp}
              />

              <TextFält
                label="Amorteringsbelopp"
                name="amortering"
                value={belopp ?? 0}
                onChange={(e) => setBelopp(Number(e.target.value))}
              />

              <TextFält
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
            kontonummer="2350"
            kontobeskrivning="Amortering av banklån"
            belopp={belopp ?? 0}
            transaktionsdatum={transaktionsdatum ?? ""}
            kommentar={kommentar ?? ""}
            valtFörval={{
              id: 0,
              namn: "Amortering av banklån",
              beskrivning: "",
              typ: "",
              kategori: "",
              konton: [],
              momssats: 0,
              specialtyp: "amorteringbanklan",
            }}
            setCurrentStep={setCurrentStep}
            extrafält={extrafält}
          />
        </div>
      </>
    );
  }
}
