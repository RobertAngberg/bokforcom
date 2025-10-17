"use client";

import LaddaUppFil from "./LaddaUppFil";
import Information from "./Information";
import Kommentar from "./Kommentar";
import Forhandsgranskning from "./Forhandsgranskning";
import TillbakaPil from "../../../_components/TillbakaPil";
import Knapp from "../../../_components/Knapp";
import { useBokforContext } from "../../context/BokforContextProvider";

export default function Steg2() {
  // Hämta all state och funktioner från useBokfor
  const { state, actions, handlers } = useBokforContext();

  // Visa bara på steg 2 och inte i levfakt mode
  if (state.currentStep !== 2 || state.levfaktMode) return null;

  if (state.valtFörval?.specialtyp) {
    // Mapping från database specialtyp till komponentnamn
    const specialtypMapping: { [key: string]: string } = {
      AvgifterAvrakningsnotaMoms: "AvgifterAvrakningsnotaMoms",
      AvrakningsnotaUtanMoms: "AvrakningsnotaUtanMoms",
      Banklan: "Banklan",
      Billeasing: "Billeasing",
      Direktpension: "Direktpension",
      DrojsmalsrantaLevFakt: "DrojsmalsrantaLevFakt",
      EgetUttag: "EgetUttag",
      Hyrbil: "Hyrbil",
      ITtjansterEU: "ITtjansterEU",
      ITtjansterUtanfEU: "ITtjansterUtanfEU",
      Importmoms: "Importmoms",
      InkopTjanstEU: "InkopTjanstEU",
      InkopTjanstUtanfEU: "InkopTjanstUtanfEU",
      InkopTjansterSverigeOmvand: "InkopTjansterSverigeOmvand",
      InkopVarorEU25: "InkopVarorEU25",
      InkopVarorUtanfEU: "InkopVarorUtanfEU",
      MilersattningEnskildFirma: "MilersattningEnskildFirma",
      Pensionsforsakring: "Pensionsforsakring",
      Rantekostnader: "Rantekostnader",
      Representation: "Representation",
      UberAvgift: "UberAvgift",
      AmorteringBanklan: "AmorteringBanklan",
    };

    const componentName = specialtypMapping[state.valtFörval.specialtyp];

    if (!componentName) {
      return <div>Okänd specialtyp: {state.valtFörval.specialtyp}</div>;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const SpecialComponent = require(`./SpecialForval/${componentName}`).default;

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
    } catch {
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
          <div className="w-full mb-10 md:w-[48%] md:mb-0 bg-slate-900 border border-gray-700 rounded-xl p-6 text-white">
            <LaddaUppFil
              fil={state.fil}
              setFil={actions.setFil}
              setPdfUrl={actions.setPdfUrl}
              setBelopp={actions.setBelopp}
              setTransaktionsdatum={actions.setTransaktionsdatum}
              onOcrTextChange={handlers.handleOcrTextChange}
              onReprocessTrigger={handlers.handleReprocessTrigger}
            />

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
    </>
  );
}
