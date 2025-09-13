"use client";

import React from "react";
import DatePicker from "react-datepicker";
import LaddaUppFil from "../../Steg/LaddaUppFil";
import Forhandsgranskning from "../../Steg/Forhandsgranskning";
import TextFalt from "../../../../_components/TextFalt";
import Knapp from "../../../../_components/Knapp";
import TillbakaPil from "../../../../_components/TillbakaPil";
import { ÅÅÅÅMMDDTillDate, dateTillÅÅÅÅMMDD } from "../../../../_utils/trueDatum";

interface StandardLayoutProps {
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
  children?: React.ReactNode;
}

export default function StandardLayout({
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
  children,
}: StandardLayoutProps) {
  return (
    <>
      <div className="max-w-5xl mx-auto px-4 relative">
        <TillbakaPil onClick={() => setCurrentStep?.(1)} />

        <h1 className="mb-6 text-3xl text-center">{title}</h1>
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
              label="Total kostnad inkl. moms"
              name="kostnad"
              value={belopp ?? ""}
              onChange={(e) => setBelopp(Number(e.target.value))}
              required
            />

            {/* Specialförval-specifikt innehåll */}
            {children}

            <label className="block text-sm font-medium text-white mb-2">Betaldatum</label>
            <DatePicker
              className="w-full p-2 mb-4 rounded bg-slate-900 text-white border border-gray-700"
              selected={transaktionsdatum ? ÅÅÅÅMMDDTillDate(transaktionsdatum) : null}
              onChange={(d) => setTransaktionsdatum(d ? dateTillÅÅÅÅMMDD(d) : "")}
              dateFormat="yyyy-MM-dd"
              locale="sv"
            />

            <TextFalt
              label="Kommentar"
              name="kommentar"
              value={kommentar ?? ""}
              onChange={(e) => setKommentar?.(e.target.value)}
              required={false}
            />

            <Knapp fullWidth text="Gå vidare" onClick={onSubmit} disabled={!isValid} />
          </div>

          <Forhandsgranskning fil={fil} pdfUrl={pdfUrl} />
        </div>
      </div>
    </>
  );
}
