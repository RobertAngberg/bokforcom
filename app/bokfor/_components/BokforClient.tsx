"use client";

import SökFörval from "./SokForval";
import Steg2 from "./Steg/Steg2";
import Steg2Levfakt from "./Steg/Steg2Levfakt";
import Steg3 from "./Steg/Steg3";
import Steg4 from "./Steg/Steg4";
import { registerLocale } from "react-datepicker";
import { sv } from "date-fns/locale/sv";
import "react-datepicker/dist/react-datepicker.css";
import { useBokfor } from "../_hooks/useBokfor";
import type { BokforClientProps } from "../_types/types";

registerLocale("sv", sv);

export default function BokforClient({ initialData }: BokforClientProps) {
  const {
    favoritFörvalen,
    isLevfaktMode,
    isUtlaggMode,
    currentStep,
    kontonummer,
    setKontonummer,
    kontobeskrivning,
    setKontobeskrivning,
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
    setValtFörval,
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
    bokförSomFaktura,
    setBokförSomFaktura,
    kundfakturadatum,
    setKundfakturadatum,
    handleSetCurrentStep,
    exitLevfaktMode,
  } = useBokfor(initialData);

  return (
    <>
      {currentStep === 1 && (
        <SökFörval
          favoritFörvalen={favoritFörvalen}
          setCurrentStep={handleSetCurrentStep}
          setvaltFörval={setValtFörval}
          setKontonummer={setKontonummer}
          setKontobeskrivning={setKontobeskrivning}
          levfaktMode={isLevfaktMode}
          utlaggMode={isUtlaggMode}
        />
      )}

      {currentStep === 2 && !isLevfaktMode && (
        <Steg2
          setCurrentStep={handleSetCurrentStep}
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
          bokförSomFaktura={bokförSomFaktura}
          setBokförSomFaktura={setBokförSomFaktura}
          kundfakturadatum={kundfakturadatum}
          setKundfakturadatum={setKundfakturadatum}
          utlaggMode={isUtlaggMode}
        />
      )}

      {currentStep === 2 && isLevfaktMode && (
        <Steg2Levfakt
          favoritFörvalen={favoritFörvalen}
          setCurrentStep={handleSetCurrentStep}
          exitLevfaktMode={exitLevfaktMode}
          setKontonummer={setKontonummer}
          setKontobeskrivning={setKontobeskrivning}
          setValtFörval={setValtFörval}
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
          leverantör={leverantör}
          setLeverantör={setLeverantör}
          fakturanummer={fakturanummer}
          setFakturanummer={setFakturanummer}
          fakturadatum={fakturadatum}
          setFakturadatum={setFakturadatum}
          förfallodatum={förfallodatum}
          setFörfallodatum={setFörfallodatum}
          betaldatum={betaldatum}
          setBetaldatum={setBetaldatum}
        />
      )}

      {currentStep === 3 && (
        <Steg3
          kontonummer={kontonummer}
          kontobeskrivning={kontobeskrivning ?? ""}
          fil={fil ?? undefined}
          belopp={belopp ?? 0}
          transaktionsdatum={transaktionsdatum ?? ""}
          kommentar={kommentar ?? ""}
          valtFörval={valtFörval}
          setCurrentStep={handleSetCurrentStep}
          extrafält={extrafält}
          utlaggMode={isUtlaggMode}
          levfaktMode={isLevfaktMode}
          leverantör={leverantör}
          fakturanummer={fakturanummer ?? ""}
          fakturadatum={fakturadatum ?? ""}
          förfallodatum={förfallodatum ?? ""}
          betaldatum={betaldatum ?? ""}
          bokförSomFaktura={bokförSomFaktura}
          kundfakturadatum={kundfakturadatum}
        />
      )}

      {currentStep === 4 && <Steg4 />}
    </>
  );
}
