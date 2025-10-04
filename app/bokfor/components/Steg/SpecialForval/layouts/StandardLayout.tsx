"use client";

import DatePicker from "react-datepicker";
import LaddaUppFil from "../../LaddaUppFil";
import Forhandsgranskning from "../../Forhandsgranskning";
import TextFalt from "../../../../../_components/TextFalt";
import Knapp from "../../../../../_components/Knapp";
import TillbakaPil from "../../../../../_components/TillbakaPil";
import { ÅÅÅÅMMDDTillDate, dateTillÅÅÅÅMMDD } from "../../../../../_utils/datum";
import { useBokforContext } from "../../../../context/BokforContextProvider";
import type { StandardLayoutProps } from "../../../../types/types";

/**
 * Props behövs eftersom varje specialförval har:
 * - Olika titel: "Hyrbil", "Inköp tjänster Sverige", "Representation" etc.
 * - Olika submit-logik: Unik gåTillSteg3-funktion för varje specialförval
 */
export default function StandardLayout({
  title,
  onSubmit,
  children,
}: StandardLayoutProps & { children?: React.ReactNode }) {
  const { handlers } = useBokforContext();
  const { state: layoutState, handlers: layoutHandlers } = handlers.useStandardLayoutHelper(
    onSubmit,
    title
  );

  const {
    belopp,
    transaktionsdatum,
    kommentar,
    fil,
    pdfUrl,
    isValid,
    title: hookTitle,
  } = layoutState;

  const {
    setBelopp,
    setTransaktionsdatum,
    setKommentar,
    setFil,
    setPdfUrl,
    setCurrentStep,
    onSubmit: hookOnSubmit,
  } = layoutHandlers;
  return (
    <>
      <div className="max-w-5xl mx-auto px-4 relative">
        <TillbakaPil onClick={() => setCurrentStep(1)} />

        <h1 className="mb-6 text-3xl text-center">{hookTitle}</h1>
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
              onChange={(e) => setKommentar(e.target.value)}
              required={false}
            />

            {children}

            <Knapp fullWidth text="Gå vidare" onClick={hookOnSubmit} disabled={!isValid} />
          </div>

          <Forhandsgranskning fil={fil} pdfUrl={pdfUrl} />
        </div>
      </div>
    </>
  );
}
