// #region Huvud
"use client";

import { useEffect, useState } from "react";
import React from "react";
import DatePicker from "react-datepicker";
import { registerLocale } from "react-datepicker";
import { sv } from "date-fns/locale/sv";
registerLocale("sv", sv);
import "react-datepicker/dist/react-datepicker.css";

import LaddaUppFilLevfakt from "./LaddaUppFilLevfakt";
import Kommentar from "./Kommentar";
import Forhandsgranskning from "./Forhandsgranskning";
import TillbakaPil from "../_components/TillbakaPil";
import KnappFullWidth from "../_components/KnappFullWidth";
import Dropdown from "../_components/Dropdown";
import TextFalt from "../_components/TextFalt";

type KontoRad = {
  beskrivning: string;
  kontonummer?: string;
  debet?: boolean;
  kredit?: boolean;
};

type Förval = {
  id: number;
  namn: string;
  beskrivning: string;
  typ: string;
  kategori: string;
  konton: KontoRad[];
  sökord: string[];
  specialtyp?: string | null;
};

interface Step2LevfaktProps {
  favoritFörvalen: Förval[];
  setCurrentStep: (step: number) => void;
  setKontonummer: (konto: string) => void;
  setKontobeskrivning: (beskrivning: string) => void;
  setFil: (fil: File | null) => void;
  setPdfUrl: (url: string | null) => void;
  setBelopp: (belopp: number | null) => void;
  setTransaktionsdatum: (datum: string | null) => void;
  setKommentar: (kommentar: string | null) => void;
  setValtFörval: (förval: Förval | null) => void;
  setExtrafält: (
    extrafält: Record<string, { label: string; debet: number; kredit: number }>
  ) => void;
  utlaggMode?: boolean;
  // Aktuella states behövs för visning
  fil?: File | null;
  pdfUrl?: string | null;
  belopp?: number | null;
  transaktionsdatum?: string | null;
  kommentar?: string | null;
  valtFörval?: Förval | null;
  extrafält?: Record<string, { label: string; debet: number; kredit: number }>;
  // Leverantörsfaktura-specifika props
  leverantör: string | null;
  setLeverantör: (leverantör: string | null) => void;
  fakturanummer: string | null;
  setFakturanummer: (nummer: string | null) => void;
  fakturadatum: string | null;
  setFakturadatum: (datum: string | null) => void;
  förfallodatum: string | null;
  setFörfallodatum: (datum: string | null) => void;
  betaldatum: string | null;
  setBetaldatum: (datum: string | null) => void;
}
// #endregion

export default function Steg2Levfakt({
  setCurrentStep,
  fil,
  setFil,
  pdfUrl,
  setPdfUrl,
  belopp,
  setBelopp,
  transaktionsdatum,
  setTransaktionsdatum,
  kommentar,
  setKommentar,
  valtFörval,
  extrafält,
  setExtrafält,
  leverantör,
  setLeverantör,
  fakturanummer,
  setFakturanummer,
  fakturadatum,
  setFakturadatum,
  förfallodatum,
  setFörfallodatum,
  betaldatum,
  setBetaldatum,
}: Step2LevfaktProps) {
  // Dummy leverantörer - här skulle du hämta från din databas
  const leverantörOptions = [
    { label: "Välj leverantör...", value: "" },
    { label: "Telia", value: "telia" },
    { label: "Ellevio", value: "ellevio" },
    { label: "ICA", value: "ica" },
    { label: "Staples", value: "staples" },
    { label: "Office Depot", value: "office_depot" },
  ];

  // Datepicker styling
  useEffect(() => {
    const datePickerEls = document.querySelectorAll(".react-datepicker-wrapper");
    datePickerEls.forEach((el) => {
      (el as HTMLElement).style.width = "100%";
    });

    const inputEls = document.querySelectorAll(".react-datepicker__input-container input");
    inputEls.forEach((el) => {
      (el as HTMLElement).className =
        "w-full p-2 mb-4 rounded text-white bg-slate-900 border border-gray-700";
    });

    // Sätt default datum
    if (!fakturadatum) {
      setFakturadatum(new Date().toISOString());
    }
    if (!förfallodatum) {
      // Default 30 dagar från idag
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      setFörfallodatum(thirtyDaysFromNow.toISOString());
    }
  }, [fakturadatum, förfallodatum]);

  //#region Visa specialförval om det finns
  if (valtFörval?.specialtyp) {
    try {
      console.log("🔍 Försöker ladda specialförval:", valtFörval.specialtyp);
      const SpecialComponent = require(`./SpecialForval/${valtFörval.specialtyp}`).default;
      return (
        <SpecialComponent
          mode="steg2"
          renderMode="levfakt"
          setCurrentStep={setCurrentStep}
          fil={fil}
          setFil={setFil}
          pdfUrl={pdfUrl}
          setPdfUrl={setPdfUrl}
          belopp={belopp}
          setBelopp={setBelopp}
          transaktionsdatum={transaktionsdatum}
          setTransaktionsdatum={setTransaktionsdatum}
          kommentar={kommentar}
          setKommentar={setKommentar}
          extrafält={extrafält}
          setExtrafält={setExtrafält}
          leverantör={leverantör}
          setLeverantör={setLeverantör}
          fakturanummer={fakturanummer}
          setFakturanummer={setFakturanummer}
          fakturadatum={fakturadatum}
          setFakturadatum={setFakturadatum}
          förfallodatum={förfallodatum}
          setFörfallodatum={setFörfallodatum}
        />
      );
    } catch (err) {
      console.error("❌ Fel vid laddning av specialförval:", valtFörval.specialtyp, err);
      return (
        <div className="p-10 text-white bg-red-900 text-center">
          ⚠️ Kunde inte ladda specialförval: {valtFörval.specialtyp}
        </div>
      );
    }
  }
  // #endregion

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 relative">
        <TillbakaPil onClick={() => setCurrentStep(1)} />

        <h1 className="mb-6 text-3xl text-center text-white">Steg 2: Leverantörsfaktura</h1>
        <div className="flex flex-col-reverse justify-between h-auto md:flex-row">
          <div className="w-full mb-10 md:w-[40%] md:mb-0 bg-slate-900 border border-gray-700 rounded-xl p-6 text-white">
            <LaddaUppFilLevfakt
              fil={fil || null}
              setFil={setFil}
              setPdfUrl={setPdfUrl}
              setBelopp={setBelopp}
              setTransaktionsdatum={setTransaktionsdatum}
              setLeverantör={setLeverantör}
              setFakturadatum={setFakturadatum}
              setFörfallodatum={setFörfallodatum}
              setFakturanummer={setFakturanummer}
            />

            {/* Leverantör dropdown */}
            <div className="mb-4">
              <Dropdown
                label="Leverantör"
                value={leverantör || ""}
                options={leverantörOptions}
                onChange={setLeverantör}
                placeholder="Välj leverantör..."
              />
            </div>

            {/* Fakturadatum */}
            <div className="mb-4">
              <label className="block mb-2 text-white">Fakturadatum:</label>
              <DatePicker
                className="w-full p-2 mb-4 rounded text-white bg-slate-900 border border-gray-700"
                selected={fakturadatum ? new Date(fakturadatum) : new Date()}
                onChange={(date) => {
                  setFakturadatum(date ? date.toISOString() : "");
                }}
                dateFormat="yyyy-MM-dd"
                locale="sv"
                required
              />
            </div>

            {/* Förfallodatum */}
            <div className="mb-4">
              <label className="block mb-2 text-white">Förfallodatum:</label>
              <DatePicker
                className="w-full p-2 mb-4 rounded text-white bg-slate-900 border border-gray-700"
                selected={förfallodatum ? new Date(förfallodatum) : new Date()}
                onChange={(date) => {
                  setFörfallodatum(date ? date.toISOString() : "");
                }}
                dateFormat="yyyy-MM-dd"
                locale="sv"
                required
              />
            </div>

            {/* Fakturanummer */}
            <div className="mb-4">
              <TextFalt
                label="Fakturanummer"
                name="fakturanummer"
                type="text"
                value={fakturanummer || ""}
                onChange={(e) => setFakturanummer(e.target.value)}
                placeholder="Ange fakturanummer..."
              />
            </div>

            {/* Belopp */}
            <div className="mb-4">
              <label htmlFor="belopp" className="block mb-2 text-white">
                Belopp:
              </label>
              <input
                className="w-full p-2 mb-4 rounded text-white bg-slate-900 border border-gray-700 appearance-none 
                [&::-webkit-outer-spin-button]:appearance-none 
                [&::-webkit-inner-spin-button]:appearance-none 
                [&::-moz-inner-spin-button]:appearance-none"
                type="number"
                id="belopp"
                name="belopp"
                required
                value={belopp || ""}
                onChange={(e) => setBelopp(Number(e.target.value))}
              />
            </div>

            {/* Betaldatum */}
            <div className="mb-4">
              <label className="block mb-2 text-white">Betaldatum:</label>
              <DatePicker
                className="w-full p-2 mb-4 rounded text-white bg-slate-900 border border-gray-700"
                selected={transaktionsdatum ? new Date(transaktionsdatum) : new Date()}
                onChange={(date) => {
                  setTransaktionsdatum(date ? date.toISOString() : "");
                }}
                dateFormat="yyyy-MM-dd"
                locale="sv"
                required
              />
            </div>

            <Kommentar kommentar={kommentar ?? ""} setKommentar={setKommentar} />
            <KnappFullWidth text="Bokför leverantörsfaktura" onClick={() => setCurrentStep(3)} />
          </div>
          <Forhandsgranskning fil={fil} pdfUrl={pdfUrl} />
        </div>
      </div>
    </>
  );
}
