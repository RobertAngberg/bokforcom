"use client";

import DatePicker from "react-datepicker";
import { registerLocale } from "react-datepicker";
import { sv } from "date-fns/locale/sv";
import "react-datepicker/dist/react-datepicker.css";
import { datePickerValue, datePickerOnChange } from "../../../_utils/trueDatum";
import LaddaUppFilLevfakt from "./LaddaUppFilLevfakt";
import Kommentar from "./Kommentar";
import Forhandsgranskning from "./Forhandsgranskning";
import TillbakaPil from "../../../_components/TillbakaPil";
import Knapp from "../../../_components/Knapp";
import TextFalt from "../../../_components/TextFalt";
import { Step2LevfaktProps } from "../../_types/types";
import ValjLeverantorModal from "../../../_components/ValjLeverantorModal";
import { useSteg2Levfakt } from "../../_hooks/useSteg2Levfakt";
import { useBokforStore } from "../../_stores/bokforStore";
registerLocale("sv", sv);

export default function Steg2Levfakt(props: Step2LevfaktProps) {
  // Hämta ALLA formulärfält från Zustand store istället för props
  const {
    belopp,
    setBelopp,
    kommentar,
    setKommentar,
    setCurrentStep,
    fil,
    setFil,
    pdfUrl,
    setPdfUrl,
    transaktionsdatum,
    setTransaktionsdatum,
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
  } = useBokforStore();

  const { exitLevfaktMode, utlaggMode } = props;

  const { visaLeverantorModal, setVisaLeverantorModal } = useSteg2Levfakt({
    fakturadatum,
    setFakturadatum,
    förfallodatum,
    setFörfallodatum,
    betaldatum,
    setBetaldatum,
  });

  if (valtFörval?.specialtyp) {
    try {
      const SpecialComponent = require(`../SpecialForval/${valtFörval.specialtyp}`).default;
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
            {leverantör && (
              <div className="mt-4 mb-4 rounded-lg border border-cyan-600/40 bg-cyan-900/20 p-3 text-sm flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-cyan-300">Leverantör vald</div>
                  <div className="text-cyan-100/80 mt-1 break-all">{leverantör.namn}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setLeverantör(null);
                    exitLevfaktMode && exitLevfaktMode();
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
                selected={datePickerValue(fakturadatum) || new Date()}
                onChange={(date) => {
                  setFakturadatum(datePickerOnChange(date));
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
                selected={datePickerValue(förfallodatum) || new Date()}
                onChange={(date) => {
                  setFörfallodatum(datePickerOnChange(date));
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

            <Kommentar kommentar={kommentar ?? ""} setKommentar={setKommentar} />
            <Knapp
              fullWidth
              text="Bokför leverantörsfaktura"
              onClick={() => setCurrentStep(3)}
              disabled={
                !belopp || !fakturanummer || !fakturadatum || !förfallodatum || !fil || !pdfUrl
              }
            />
          </div>
          <Forhandsgranskning fil={fil} pdfUrl={pdfUrl} />
        </div>
      </div>
      <ValjLeverantorModal
        isOpen={visaLeverantorModal}
        skipNavigate
        onSelected={(lev) => {
          setLeverantör(lev);
        }}
        onClose={() => setVisaLeverantorModal(false)}
      />
    </>
  );
}
