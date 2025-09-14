"use client";

import { useState, useEffect, useCallback } from "react";
import LaddaUppFil from "./LaddaUppFil";
import Information from "./Information";
import Kommentar from "./Kommentar";
import Forhandsgranskning from "./Forhandsgranskning";
import TillbakaPil from "../../../_components/TillbakaPil";
import Knapp from "../../../_components/Knapp";
import ValjLeverantorModal from "../../../_components/ValjLeverantorModal";
import { Step2Props } from "../../_types/types";
import { useSteg2 } from "../../_hooks/useSteg2";
import { useBokforStore } from "../../_stores/bokforStore";

export default function Steg2(props: Step2Props) {
  // ✨ CLEAN: Alla formulärfält från Zustand store
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
    bokförSomFaktura,
    setBokförSomFaktura,
    kundfakturadatum,
    setKundfakturadatum,
    leverantör,
    setLeverantör,
  } = useBokforStore();

  // Bara UI-läge från props
  const { utlaggMode } = props;

  const {
    bokföringsmetod,
    setBokföringsmetod,
    fakturadatum,
    setFakturadatum,
    ocrText,
    setOcrText,
    reprocessFile,
    setReprocessFile,
    visaLeverantorModal,
    setVisaLeverantorModal,
    harIntaktskonto,
    harKostnadskonto,
    foreslaLevfakt,
  } = useSteg2({
    ...props,
    // Skicka store-värden till hook
    bokförSomFaktura,
    setBokförSomFaktura,
    kundfakturadatum,
    setKundfakturadatum,
  });

  // Hantera OCR-text från LaddaUppFil
  const handleOcrTextChange = useCallback((text: string) => {
    setOcrText(text);
  }, []);

  // Ta emot reprocess-funktionen från LaddaUppFil
  const handleReprocessTrigger = useCallback((reprocessFn: () => Promise<void>) => {
    setReprocessFile(() => reprocessFn);
  }, []);

  // Hantera checkbox-klick - trigga OCR igen för fakturamoden
  const handleCheckboxChange = useCallback(
    async (checked: boolean) => {
      setBokförSomFaktura(checked);

      if (checked && reprocessFile) {
        await reprocessFile();
      }
    },
    [reprocessFile]
  );

  if (valtFörval?.specialtyp) {
    try {
      const SpecialComponent = require(`../SpecialForval/${valtFörval.specialtyp}`).default;
      return (
        <SpecialComponent
          mode="steg2"
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
          valtFörval={valtFörval}
          extrafält={extrafält}
          setExtrafält={setExtrafält}
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

        <h1 className="mb-6 text-3xl text-center text-white">
          {utlaggMode ? "Steg 2: Fyll i uppgifter för utlägg" : "Steg 2: Fyll i uppgifter"}
        </h1>
        <div className="flex flex-col-reverse justify-between h-auto md:flex-row">
          <div className="w-full mb-10 md:w-[40%] md:mb-0 bg-slate-900 border border-gray-700 rounded-xl p-6 text-white">
            {/* (Tidigare info-rutor borttagna) */}
            <LaddaUppFil
              fil={fil}
              setFil={setFil}
              setPdfUrl={setPdfUrl}
              setBelopp={setBelopp}
              setTransaktionsdatum={setTransaktionsdatum}
              onOcrTextChange={handleOcrTextChange}
              skipBasicAI={bokförSomFaktura}
              onReprocessTrigger={handleReprocessTrigger}
            />

            {bokföringsmetod === "Fakturametoden" && !utlaggMode && (
              <div className="mt-4 mb-4">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-amber-500 bg-gray-700 border-gray-600 rounded focus:ring-amber-500"
                    checked={!!leverantör || visaLeverantorModal}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setVisaLeverantorModal(true);
                      } else {
                        setVisaLeverantorModal(false);
                        setLeverantör(null);
                      }
                    }}
                  />
                  <span className="text-sm text-white">Bokför som leverantörsfaktura</span>
                </label>

                {/* Visa vald leverantör */}
                {leverantör && (
                  <div className="mt-2 p-3 bg-gray-800 rounded border border-gray-600">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-green-400 font-medium">{leverantör.namn}</span>
                        {leverantör.organisationsnummer && (
                          <span className="text-gray-400 text-sm ml-2">
                            ({leverantör.organisationsnummer})
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setLeverantör(null);
                          setVisaLeverantorModal(false);
                        }}
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
              visaFakturadatum={bokförSomFaktura}
              fakturadatum={fakturadatum}
              setFakturadatum={setFakturadatum}
            />
            <Kommentar />
            <Knapp
              text="Bokför"
              onClick={() => setCurrentStep(3)}
              disabled={!belopp || !transaktionsdatum || !fil || !pdfUrl}
              fullWidth
            />
          </div>
          <Forhandsgranskning fil={fil} pdfUrl={pdfUrl} />
        </div>
      </div>
      {/* Leverantörsmodal */}
      <ValjLeverantorModal
        isOpen={visaLeverantorModal}
        onClose={() => setVisaLeverantorModal(false)}
        onSelected={(leverantör) => {
          setLeverantör(leverantör);
          setVisaLeverantorModal(false);
        }}
        skipNavigate={true}
      />
    </>
  );
}
