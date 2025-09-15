"use client";

import DatePicker from "react-datepicker";
import { registerLocale } from "react-datepicker";
import { sv } from "date-fns/locale/sv";
import "react-datepicker/dist/react-datepicker.css";
import { datePickerValue, datePickerOnChange } from "../../../_utils/datum";
import LaddaUppFil from "./LaddaUppFil";
import Kommentar from "./Kommentar";
import Forhandsgranskning from "./Forhandsgranskning";
import TillbakaPil from "../../../_components/TillbakaPil";
import Knapp from "../../../_components/Knapp";
import TextFalt from "../../../_components/TextFalt";
import ValjLeverantorModal from "../../../_components/ValjLeverantorModal";
import { useSteg2Levfakt } from "../../_hooks/useSteg2Levfakt";

registerLocale("sv", sv);

export default function Steg2Levfakt() {
  const { state, actions, handlers } = useSteg2Levfakt();

  // Visa bara på steg 2 och i levfakt mode
  if (state.currentStep !== 2 || !state.levfaktMode) return null;

  if (state.valtFörval?.specialtyp) {
    try {
      const SpecialComponent = require(`../SpecialForval/${state.valtFörval.specialtyp}`).default;
      return (
        <SpecialComponent
          mode="steg2"
          renderMode="levfakt"
          belopp={state.belopp}
          setBelopp={actions.setBelopp}
          transaktionsdatum={state.transaktionsdatum}
          setTransaktionsdatum={actions.setTransaktionsdatum}
          kommentar={state.kommentar}
          setKommentar={actions.setKommentar}
          setCurrentStep={actions.setCurrentStep}
          fil={state.fil}
          setFil={actions.setFil}
          pdfUrl={state.pdfUrl}
          setPdfUrl={actions.setPdfUrl}
          extrafält={state.extrafält}
          setExtrafält={actions.setExtrafält}
          leverantör={state.leverantör}
          setLeverantör={actions.setLeverantör}
          fakturanummer={state.fakturanummer}
          setFakturanummer={actions.setFakturanummer}
          fakturadatum={state.fakturadatum}
          setFakturadatum={actions.setFakturadatum}
          förfallodatum={state.förfallodatum}
          setFörfallodatum={actions.setFörfallodatum}
        />
      );
    } catch (err) {
      console.error("❌ Fel vid laddning av specialförval:", state.valtFörval.specialtyp, err);
      return (
        <div className="p-10 text-white bg-red-900 text-center">
          ⚠️ Kunde inte ladda specialförval: {state.valtFörval.specialtyp}
        </div>
      );
    }
  }

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 relative">
        <TillbakaPil onClick={() => actions.setCurrentStep(1)} />

        <h1 className="mb-6 text-3xl text-center text-white">Steg 2: Leverantörsfaktura</h1>
        <div className="flex flex-col-reverse justify-between h-auto md:flex-row">
          <div className="w-full mb-10 md:w-[40%] md:mb-0 bg-slate-900 border border-gray-700 rounded-xl p-6 text-white">
            <LaddaUppFil
              fil={state.fil || null}
              setFil={actions.setFil}
              setPdfUrl={actions.setPdfUrl}
              setBelopp={actions.setBelopp}
              setTransaktionsdatum={actions.setTransaktionsdatum}
              setLeverantör={actions.setLeverantör}
              setFakturadatum={actions.setFakturadatum}
              setFörfallodatum={actions.setFörfallodatum}
              setFakturanummer={actions.setFakturanummer}
            />
            {state.leverantör && (
              <div className="mt-4 mb-4 rounded-lg border border-cyan-600/40 bg-cyan-900/20 p-3 text-sm flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-cyan-300">Leverantör vald</div>
                  <div className="text-cyan-100/80 mt-1 break-all">{state.leverantör.namn}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    actions.setLeverantör(null);
                    handlers.exitLevfaktMode && handlers.exitLevfaktMode();
                  }}
                  className="text-[11px] px-2 py-1 rounded bg-red-700/40 hover:bg-red-700/60 border border-red-500/40"
                >
                  Ta bort
                </button>
              </div>
            )}

            {/* Fakturadatum */}
            <div className="mb-4">
              <label className="block mb-2 text-white">Fakturadatum:</label>
              <DatePicker
                className="w-full p-2 mb-4 rounded text-white bg-slate-900 border border-gray-700"
                selected={datePickerValue(state.fakturadatum) || new Date()}
                onChange={(date) => {
                  actions.setFakturadatum(datePickerOnChange(date));
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
                selected={datePickerValue(state.förfallodatum) || new Date()}
                onChange={(date) => {
                  actions.setFörfallodatum(datePickerOnChange(date));
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
                value={state.fakturanummer || ""}
                onChange={(e) => actions.setFakturanummer(e.target.value)}
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
                value={state.belopp || ""}
                onChange={(e) => actions.setBelopp(Number(e.target.value))}
              />
            </div>

            <Kommentar kommentar={state.kommentar ?? ""} setKommentar={actions.setKommentar} />
            <Knapp
              fullWidth
              text="Bokför leverantörsfaktura"
              onClick={() => actions.setCurrentStep(3)}
              disabled={
                !state.belopp ||
                !state.fakturanummer ||
                !state.fakturadatum ||
                !state.förfallodatum ||
                !state.fil ||
                !state.pdfUrl
              }
            />
          </div>
          <Forhandsgranskning fil={state.fil} pdfUrl={state.pdfUrl} />
        </div>
      </div>
      <ValjLeverantorModal
        isOpen={state.visaLeverantorModal}
        skipNavigate
        onSelected={(lev) => {
          actions.setLeverantör(lev);
        }}
        onClose={() => actions.setVisaLeverantorModal(false)}
      />
    </>
  );
}
