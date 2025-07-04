// #region Huvud
"use client";

import { useState } from "react";
import LaddaUppFil from "../LaddaUppFil";
import Forhandsgranskning from "../Förhandsgranskning";
import TextFält from "../../_components/TextFält";
import KnappFullWidth from "../../_components/KnappFullWidth";
import { ÅÅÅÅMMDDTillDate, dateTillÅÅÅÅMMDD } from "../../_utils/datum";
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
  setExtrafält?: (fält: Record<string, { label: string; debet: number; kredit: number }>) => void;
}
// #endregion

export default function Importmoms({
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
  // #region State och oanvänd momsvariabel...
  const [tull, setTull] = useState("");
  const [fiktiv, setFiktiv] = useState("");
  const [ovrigt, setOvrigt] = useState("");
  const giltigt = !!belopp && !!transaktionsdatum;
  const moms = parseFloat((parseFloat(tull || "0") * 0.25).toFixed(2));
  // #endregion

  function gåTillSteg3() {
    const extrafältObj = {
      "1930": { label: "Företagskonto / affärskonto", debet: 0, kredit: belopp ?? 0 },
      "2615": {
        label: "Utgående moms import av varor, 25%",
        debet: 0,
        kredit: parseFloat(fiktiv || "0"),
      },
      "2640": { label: "Ingående moms", debet: parseFloat(tull || "0") * 0.2, kredit: 0 },
      "2645": {
        label: "Beräknad ingående moms på förvärv från utlandet",
        debet: parseFloat(fiktiv || "0"),
        kredit: 0,
      },
      "4545": {
        label: "Import av varor, 25 % moms",
        debet: parseFloat(fiktiv || "0") * 4,
        kredit: 0,
      },
      "4549": {
        label: "Motkonto beskattningsunderlag import",
        debet: 0,
        kredit: parseFloat(fiktiv || "0") * 4,
      },
      "5720": {
        label: "Tull- och speditionskostnader m.m.",
        debet: parseFloat(tull || "0") * 0.8 + parseFloat(ovrigt || "0"), // ✅ LÄGG TILL ÖVRIGA!
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
          <BakåtPil onClick={() => setCurrentStep?.(1)} />

          <h1 className="mb-6 text-3xl text-center">Steg 2: Importmoms</h1>

          <div className="flex flex-col-reverse justify-between max-w-5xl mx-auto px-4 md:flex-row">
            <div className="w-full md:w-[40%] bg-slate-900 border border-gray-700 rounded-xl p-6">
              <LaddaUppFil
                fil={fil}
                setFil={setFil}
                setPdfUrl={setPdfUrl}
                setTransaktionsdatum={setTransaktionsdatum}
                setBelopp={setBelopp}
              />

              <div className="mb-4 p-4 border border-gray-700 rounded-lg">
                <p className="text-sm text-gray-400">
                  <strong>💡 Importmoms steg-för-steg:</strong>
                  <br />
                  <br />
                  1️ - Du köper varor utanför EU (ex. 20 000 kr) - ingen moms betalas till säljaren
                  <br />
                  <br />
                  2 - Transportföretaget skickar tullfaktura (ex. 300 kr totalt)
                  <br />
                  <br />3 - Fyll i: Total tullfaktura (300), Tull/frakt inkl. moms (100), Fiktiv
                  moms 25% av varans värde (5000), Övriga kostnader utan moms (200)
                </p>
              </div>

              <TextFält
                label="Totalt belopp att betala in"
                name="belopp"
                value={belopp ?? ""}
                onChange={(e) => setBelopp(Number(e.target.value))}
                required
              />
              <TextFält
                label="Tull och spedition m.m. inkl. moms"
                name="tull"
                value={tull}
                onChange={(e) => setTull(e.target.value)}
                required
              />
              <TextFält
                label="Ingående fiktiv moms på förvärv från utlandet"
                name="fiktiv"
                value={fiktiv}
                onChange={(e) => setFiktiv(e.target.value)}
                required
              />
              <TextFält
                label="Övriga skatter och tillval utan moms"
                name="ovrigt"
                value={ovrigt}
                onChange={(e) => setOvrigt(e.target.value)}
                required
              />

              <label className="block text-sm font-medium text-white mb-2">Betaldatum</label>
              <DatePicker
                className="w-full p-2 mb-4 rounded bg-slate-900 text-white border border-gray-700"
                selected={ÅÅÅÅMMDDTillDate(transaktionsdatum)}
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

              <KnappFullWidth text="Bokför" onClick={gåTillSteg3} disabled={!giltigt} />
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
            kontonummer="4545"
            kontobeskrivning="Importmoms"
            belopp={belopp ?? 0}
            transaktionsdatum={transaktionsdatum ?? ""}
            kommentar={kommentar ?? ""}
            valtFörval={{
              id: 0,
              namn: "Importmoms",
              beskrivning: "",
              typ: "",
              kategori: "",
              konton: [],
              momssats: 0.25,
              specialtyp: "importmoms",
            }}
            setCurrentStep={setCurrentStep}
            extrafält={extrafält}
          />
        </div>
      </>
    );
  }
}
