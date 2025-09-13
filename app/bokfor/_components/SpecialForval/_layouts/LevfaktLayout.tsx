"use client";

import React, { useEffect } from "react";
import DatePicker from "react-datepicker";
import { registerLocale } from "react-datepicker";
import { sv } from "date-fns/locale/sv";
registerLocale("sv", sv);
import { datePickerValue, datePickerOnChange } from "../../../../_utils/trueDatum";

import LaddaUppFilLevfakt from "../../Steg/LaddaUppFilLevfakt";
import Kommentar from "../../Steg/Kommentar";
import Forhandsgranskning from "../../Steg/Forhandsgranskning";
import TillbakaPil from "../../../../_components/TillbakaPil";
import Knapp from "../../../../_components/Knapp";
import Dropdown from "../../../../_components/Dropdown";
import TextFalt from "../../../../_components/TextFalt";

interface LevfaktLayoutProps {
  // Specialförval basics
  title: string;
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
  onSubmit: () => void;
  isValid: boolean;

  // Leverantörsfaktura-specifika props
  leverantör?: string | Leverantör;
  setLeverantör?: (val: string | Leverantör | null) => void;
  fakturanummer?: string;
  setFakturanummer?: (val: string) => void;
  fakturadatum?: string;
  setFakturadatum?: (val: string) => void;
  förfallodatum?: string;
  setFörfallodatum?: (val: string) => void;

  // Optional extra content
  children?: React.ReactNode;
}

export default function LevfaktLayout({
  title,
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
  onSubmit,
  isValid,
  leverantör = "",
  setLeverantör,
  fakturanummer = "",
  setFakturanummer,
  fakturadatum = "",
  setFakturadatum,
  förfallodatum = "",
  setFörfallodatum,
  children,
}: LevfaktLayoutProps) {
  // Extra validering för leverantörsfaktura-specifika fält
  const leverantörIsValid =
    leverantör &&
    (typeof leverantör === "string"
      ? leverantör.trim() !== ""
      : typeof leverantör === "object" && leverantör.namn && leverantör.namn.trim() !== "");
  const fakturanummerIsValid =
    fakturanummer && typeof fakturanummer === "string" && fakturanummer.trim() !== "";
  const fakturadatumIsValid =
    fakturadatum && typeof fakturadatum === "string" && fakturadatum.trim() !== "";
  const fullIsValid = isValid && leverantörIsValid && fakturanummerIsValid && fakturadatumIsValid;
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
    if (!fakturadatum && setFakturadatum) {
      setFakturadatum(datePickerOnChange(new Date()));
    }
    if (!förfallodatum && setFörfallodatum) {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      setFörfallodatum(datePickerOnChange(thirtyDaysFromNow));
    }
  }, [fakturadatum, förfallodatum, setFakturadatum, setFörfallodatum]);

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 relative">
        <TillbakaPil onClick={() => setCurrentStep?.(1)} />

        <h1 className="mb-6 text-3xl text-center text-white">{title}</h1>
        <div className="flex flex-col-reverse justify-between h-auto md:flex-row">
          <div className="w-full mb-10 md:w-[40%] md:mb-0 bg-slate-900 border border-gray-700 rounded-xl p-6 text-white">
            <LaddaUppFilLevfakt
              fil={fil || null}
              setFil={setFil}
              setPdfUrl={setPdfUrl}
              setBelopp={setBelopp}
              setTransaktionsdatum={setTransaktionsdatum}
              setLeverantör={
                setLeverantör
                  ? (leverantör) => {
                      if (typeof leverantör === "string") {
                        setLeverantör(leverantör);
                      } else {
                        setLeverantör(leverantör);
                      }
                    }
                  : () => {}
              }
              setFakturadatum={setFakturadatum ? (datum) => setFakturadatum(datum || "") : () => {}}
              setFörfallodatum={
                setFörfallodatum ? (datum) => setFörfallodatum(datum || "") : () => {}
              }
              setFakturanummer={setFakturanummer || (() => {})}
            />

            {/* Leverantör - alltid från första steget */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-white mb-2">Leverantör</label>
              <div className="bg-slate-800 border border-slate-600 rounded-lg p-3">
                <div className="text-white font-medium">
                  {typeof leverantör === "string"
                    ? leverantör
                    : leverantör?.namn || "Ingen leverantör vald"}
                </div>
                {typeof leverantör === "object" && leverantör?.organisationsnummer && (
                  <div className="text-sm text-gray-400 mt-1">
                    Org-nr: {leverantör.organisationsnummer}
                  </div>
                )}
              </div>
            </div>

            {/* Fakturanummer */}
            <TextFalt
              label="Fakturanummer"
              name="fakturanummer"
              value={fakturanummer}
              onChange={(e) => setFakturanummer?.(e.target.value)}
              required
            />

            {/* Fakturadatum */}
            <label className="block text-sm font-medium text-white mb-2">Fakturadatum</label>
            <DatePicker
              className="w-full p-2 mb-4 rounded text-white bg-slate-900 border border-gray-700"
              selected={datePickerValue(fakturadatum)}
              onChange={(date) => setFakturadatum?.(datePickerOnChange(date))}
              dateFormat="yyyy-MM-dd"
              locale="sv"
              required
            />

            {/* Förfallodatum */}
            <label className="block text-sm font-medium text-white mb-2">Förfallodatum</label>
            <DatePicker
              className="w-full p-2 mb-4 rounded text-white bg-slate-900 border border-gray-700"
              selected={datePickerValue(förfallodatum)}
              onChange={(date) => setFörfallodatum?.(datePickerOnChange(date))}
              dateFormat="yyyy-MM-dd"
              locale="sv"
              required
            />

            {/* Belopp */}
            <TextFalt
              label="Total kostnad inkl. moms"
              name="kostnad"
              value={belopp ?? ""}
              onChange={(e) => setBelopp(Number(e.target.value))}
              required
            />

            {/* Betaldatum */}
            <label className="block text-sm font-medium text-white mb-2">Betaldatum</label>
            <DatePicker
              className="w-full p-2 mb-4 rounded text-white bg-slate-900 border border-gray-700"
              selected={datePickerValue(transaktionsdatum)}
              onChange={(date) => setTransaktionsdatum(datePickerOnChange(date))}
              dateFormat="yyyy-MM-dd"
              locale="sv"
              required
            />

            {/* Specialförval-specifikt innehåll */}
            {children}

            {/* Kommentar */}
            <Kommentar
              kommentar={kommentar ?? ""}
              setKommentar={setKommentar ? (val) => setKommentar(val) : () => {}}
            />

            {/* Submit knapp */}
            <Knapp fullWidth text="Bokför" onClick={onSubmit} disabled={!fullIsValid} />
          </div>

          <Forhandsgranskning fil={fil} pdfUrl={pdfUrl} />
        </div>
      </div>
    </>
  );
}
