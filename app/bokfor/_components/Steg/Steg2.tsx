"use client";

import LaddaUppFil from "./LaddaUppFil";
import Information from "./Information";
import Kommentar from "./Kommentar";
import Forhandsgranskning from "./Forhandsgranskning";
import TillbakaPil from "../../../_components/TillbakaPil";
import Knapp from "../../../_components/Knapp";
import ValjLeverantorModal from "../../../_components/ValjLeverantorModal";
import { useBokforContext } from "../BokforProvider";

export default function Steg2() {
  // Hämta all state och funktioner från useBokfor
  const { state, actions, handlers } = useBokforContext();

  // Visa bara på steg 2 och inte i levfakt mode
  if (state.currentStep !== 2 || state.levfaktMode) return null;

  if (state.valtFörval?.specialtyp) {
    try {
      const SpecialComponent = require(`./SpecialForval/${state.valtFörval.specialtyp}`).default;

      return (
        <SpecialComponent
          mode="steg2"
          setCurrentStep={actions.setCurrentStep}
          fil={state.fil}
          setFil={actions.setFil}
          pdfUrl={state.pdfUrl}
          setPdfUrl={actions.setPdfUrl}
          belopp={state.belopp}
          setBelopp={actions.setBelopp}
          transaktionsdatum={state.transaktionsdatum}
          setTransaktionsdatum={actions.setTransaktionsdatum}
          kommentar={state.kommentar}
          setKommentar={actions.setKommentar}
          valtFörval={state.valtFörval}
          extrafält={state.extrafält}
          setExtrafält={actions.setExtrafält}
        />
      );
    } catch (error) {
      return <div>Fel vid laddning av specialkomponent: {state.valtFörval.specialtyp}</div>;
    }
  }

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 relative">
        <TillbakaPil onClick={() => actions.setCurrentStep(1)} />

        <h1 className="mb-6 text-3xl text-center text-white">
          {state.utlaggMode ? "Steg 2: Fyll i uppgifter för utlägg" : "Steg 2: Fyll i uppgifter"}
        </h1>
        <div className="flex flex-col-reverse justify-between h-auto md:flex-row">
          <div className="w-full mb-10 md:w-[40%] md:mb-0 bg-slate-900 border border-gray-700 rounded-xl p-6 text-white">
            <LaddaUppFil
              fil={state.fil}
              setFil={actions.setFil}
              setPdfUrl={actions.setPdfUrl}
              setBelopp={actions.setBelopp}
              setTransaktionsdatum={actions.setTransaktionsdatum}
              onOcrTextChange={handlers.handleOcrTextChange}
              skipBasicAI={state.bokförSomFaktura}
              onReprocessTrigger={handlers.handleReprocessTrigger}
            />

            {state.bokföringsmetod === "Fakturametoden" && !state.utlaggMode && (
              <div className="mt-4 mb-4">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-amber-500 bg-gray-700 border-gray-600 rounded focus:ring-amber-500"
                    checked={!!state.leverantör || state.visaLeverantorModal}
                    onChange={(e) => handlers.handleLeverantorCheckboxChange(e.target.checked)}
                  />
                  <span className="text-sm text-white">Bokför som leverantörsfaktura</span>
                </label>

                {/* Visa vald leverantör */}
                {state.leverantör && (
                  <div className="mt-2 p-3 bg-gray-800 rounded border border-gray-600">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-green-400 font-medium">{state.leverantör.namn}</span>
                        {state.leverantör.organisationsnummer && (
                          <span className="text-gray-400 text-sm ml-2">
                            ({state.leverantör.organisationsnummer})
                          </span>
                        )}
                      </div>
                      <button
                        onClick={handlers.handleLeverantorRemove}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Ta bort
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <Information
              visaFakturadatum={state.bokförSomFaktura}
              fakturadatum={state.fakturadatum}
              setFakturadatum={actions.setFakturadatum}
            />
            <Kommentar />
            <Knapp
              text="Bokför"
              onClick={() => actions.setCurrentStep(3)}
              disabled={!state.belopp || !state.transaktionsdatum || !state.fil || !state.pdfUrl}
              fullWidth
            />
          </div>
          <Forhandsgranskning fil={state.fil} pdfUrl={state.pdfUrl} />
        </div>
      </div>
      <ValjLeverantorModal
        isOpen={state.visaLeverantorModal}
        onClose={handlers.handleLeverantorModalClose}
        onSelected={handlers.handleLeverantorSelected}
        skipNavigate={true}
      />
    </>
  );
}
