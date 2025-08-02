// #region Huvud
"use client";

import { useState } from "react";
import LaddaUppFil from "../LaddaUppFil";
import Forhandsgranskning from "../Forhandsgranskning";
import TextFalt from "../../_components/TextFalt";
import KnappFullWidth from "../../_components/KnappFullWidth";
import { formatSEK, parseNumber } from "../../_utils/format";
import DatePicker from "react-datepicker";
import Steg3 from "../Steg3";
import { ÅÅÅÅMMDDTillDate, dateTillÅÅÅÅMMDD } from "../../_utils/datum";
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
  setExtrafält?: (fält: Record<string, { label: string; debet: number; kredit: number }>) => void;
}
// #endregion

export default function MilersattningEnskildFirma({
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
  const [mil, setMil] = useState("1");
  const [ersPerMil, setErsPerMil] = useState("25");
  const [biltyp, setBiltyp] = useState("Egen bil");

  const giltigt = !!belopp && !!transaktionsdatum;

  function getSkattefriPerMil(biltyp: string): number {
    if (biltyp === "Egen bil") return 25;
    if (biltyp === "Tjänstebil bensin el. diesel") return 12;
    if (biltyp === "Tjänstebil Elbil") return 9.5;
    return 0;
  }

  function gåTillSteg3() {
    const milVal = parseNumber(mil);
    const ersVal = parseNumber(ersPerMil);
    const total = milVal * ersVal;

    const skattefriPerMil = getSkattefriPerMil(biltyp);
    const skattefri = Math.min(ersVal, skattefriPerMil) * milVal;
    const skattepliktig = Math.max(0, ersVal - skattefriPerMil) * milVal;

    const extrafältData: Record<string, { label: string; debet: number; kredit: number }> = {
      "5841": {
        label: "Milersättning, avdragsgill (Ägare enskild firma)",
        debet: skattefri,
        kredit: 0,
      },
      ...(skattepliktig > 0 && {
        "5842": {
          label: "Milersättning, ej avdragsgill (Ägare enskild firma)",
          debet: skattepliktig,
          kredit: 0,
        },
      }),
      "1930": {
        label: "Företagskonto / affärskonto",
        debet: 0,
        kredit: total,
      },
    };

    setExtrafält?.(extrafältData);
    setBelopp(total);
    setCurrentStep?.(3);
  }

  if (mode === "steg2") {
    return (
      <>
        <div className="max-w-5xl mx-auto px-4 relative">
          <TillbakaPil onClick={() => setCurrentStep?.(1)} />

          <h1 className="mb-6 text-3xl text-center">Steg 2: Milersättning</h1>
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
                name="mil"
                label="Antal mil"
                type="number"
                value={mil}
                onChange={(e) => setMil(e.target.value)}
              />

              <TextFalt
                name="ersPerMil"
                label="Ersättning per mil"
                type="number"
                value={ersPerMil}
                onChange={(e) => setErsPerMil(e.target.value)}
              />

              <div className="mb-4">
                <label className="block mb-1 text-sm text-gray-400">Biltyp</label>
                <select
                  value={biltyp}
                  onChange={(e) => setBiltyp(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 text-white border border-gray-600 rounded"
                >
                  <option>Egen bil</option>
                  <option>Tjänstebil bensin el. diesel</option>
                  <option>Tjänstebil Elbil</option>
                </select>
              </div>

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
                name="kommentar"
                label="Kommentar"
                type="textarea"
                value={kommentar ?? ""}
                onChange={(e) => setKommentar?.(e.target.value)}
              />

              <KnappFullWidth text="Bokför" onClick={gåTillSteg3} disabled={!giltigt} />
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
            kontonummer="7331"
            kontobeskrivning="Milersättning"
            belopp={belopp ?? 0}
            transaktionsdatum={transaktionsdatum ?? ""}
            kommentar={kommentar ?? ""}
            valtFörval={{
              id: 0,
              namn: "Milersättning",
              beskrivning: "",
              typ: "",
              kategori: "",
              konton: [],
              momssats: 0,
              specialtyp: "milersattningenskildfirma",
            }}
            setCurrentStep={setCurrentStep}
            extrafält={extrafält}
          />
        </div>
      </>
    );
  }
}
