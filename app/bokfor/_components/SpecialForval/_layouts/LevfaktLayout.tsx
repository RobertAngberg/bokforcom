/**
 * LevfaktLayout - Återanvändbar layout för leverantörsfaktura-specialförval
 *
 * Används specifikt av specialförval som hanterar leverantörsfakturor:
 * - InkopTjansterSverigeOmvand, InkopTjanstUtanfEU, InkopTjanstEU
 * - Hyrbil, Billeasing, Importmoms, Representation
 * - ITtjansterEU, ITtjansterUtanfEU
 *
 * INTE används av enkla specialförval som EgetUttag, Banklan,
 * Pensionsforsakring etc. (de har egna layouts utan leverantörsfält)
 *
 * Children-prop används för specialförval-specifikt innehåll:
 * - Vissa specialförval har extra fält (children med innehåll)
 * - Andra har bara standard-fälten (tomma children)
 * - Flexibilitet för framtida leverantörsfaktura-specialförval
 */

"use client";

import { datePickerValue, datePickerOnChange } from "../../../../_utils/trueDatum";
import LaddaUppFilLevfakt from "../../Steg/LaddaUppFilLevfakt";
import Kommentar from "../../Steg/Kommentar";
import Forhandsgranskning from "../../Steg/Forhandsgranskning";
import TillbakaPil from "../../../../_components/TillbakaPil";
import Knapp from "../../../../_components/Knapp";
import TextFalt from "../../../../_components/TextFalt";
import { useLevfaktLayout } from "../../../_hooks/useLevfaktLayout";
import DatePicker from "react-datepicker";
import { registerLocale } from "react-datepicker";
import { sv } from "date-fns/locale/sv";
registerLocale("sv", sv);

export default function LevfaktLayout({ children }: { children?: React.ReactNode }) {
  const {
    belopp,
    transaktionsdatum,
    kommentar,
    fil,
    pdfUrl,
    leverantör,
    fakturanummer,
    fakturadatum,
    förfallodatum,
    setBelopp,
    setTransaktionsdatum,
    setKommentar,
    setFil,
    setPdfUrl,
    setLeverantör,
    setFakturanummer,
    setFakturadatum,
    setFörfallodatum,
    setCurrentStep,
    title,
    onSubmit,
    fullIsValid,
  } = useLevfaktLayout();

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 relative">
        <TillbakaPil onClick={() => setCurrentStep(1)} />

        <h1 className="mb-6 text-3xl text-center text-white">{title}</h1>
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
              value={fakturanummer ?? ""}
              onChange={(e) => setFakturanummer(e.target.value)}
              required
            />

            {/* Fakturadatum */}
            <label className="block text-sm font-medium text-white mb-2">Fakturadatum</label>
            <DatePicker
              className="w-full p-2 mb-4 rounded text-white bg-slate-900 border border-gray-700"
              selected={datePickerValue(fakturadatum)}
              onChange={(date) => setFakturadatum(datePickerOnChange(date))}
              dateFormat="yyyy-MM-dd"
              locale="sv"
              required
            />

            {/* Förfallodatum */}
            <label className="block text-sm font-medium text-white mb-2">Förfallodatum</label>
            <DatePicker
              className="w-full p-2 mb-4 rounded text-white bg-slate-900 border border-gray-700"
              selected={datePickerValue(förfallodatum)}
              onChange={(date) => setFörfallodatum(datePickerOnChange(date))}
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
            <Kommentar kommentar={kommentar ?? ""} setKommentar={setKommentar} />

            {/* Submit knapp */}
            <Knapp fullWidth text="Bokför" onClick={onSubmit} disabled={!fullIsValid} />
          </div>

          <Forhandsgranskning fil={fil} pdfUrl={pdfUrl} />
        </div>
      </div>
    </>
  );
}
