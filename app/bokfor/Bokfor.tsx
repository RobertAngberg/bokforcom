//#region Huvud
"use client";

import { useState, useEffect } from "react";
import SökFörval from "./SokForval";
import Steg2 from "./Steg2";
import Steg2Levfakt from "./steg2Levfakt";
import Steg3 from "./Steg3";
import Steg4 from "./Steg4";
import MainLayout from "../_components/MainLayout";
import { registerLocale } from "react-datepicker";
import { sv } from "date-fns/locale/sv";
import "react-datepicker/dist/react-datepicker.css";
import { getLeverantörer, type Leverantör } from "../faktura/actions";

// För React DatePicker
registerLocale("sv", sv);

type KontoRad = {
  beskrivning: string;
  kontonummer?: string;
  debet?: boolean;
  kredit?: boolean;
};

type Extrafält = {
  namn: string;
  label: string;
  konto: string;
  debet: boolean;
  kredit: boolean;
};

type Forval = {
  id: number;
  namn: string;
  beskrivning: string;
  typ: string;
  kategori: string;
  konton: KontoRad[];
  sökord: string[];
  extrafält?: Extrafält[];
};

type Props = {
  favoritFörvalen: Forval[];
  utlaggMode?: boolean;
  levfaktMode?: boolean;
  leverantorId?: number | null;
};
//#endregion

export default function Bokför({
  favoritFörvalen,
  utlaggMode = false,
  levfaktMode = false,
  leverantorId = null,
}: Props) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [kontonummer, setKontonummer] = useState<string>("");
  const [kontobeskrivning, setKontobeskrivning] = useState<string>();
  const [fil, setFil] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [belopp, setBelopp] = useState<number | null>(null);
  const [transaktionsdatum, setTransaktionsdatum] = useState<string | null>(null);
  const [kommentar, setKommentar] = useState<string | null>(null);
  const [valtFörval, setValtFörval] = useState<Forval | null>(null);
  const [extrafält, setExtrafält] = useState<
    Record<string, { label: string; debet: number; kredit: number }>
  >({});

  // Leverantörsfaktura-specifika states
  const [leverantör, setLeverantör] = useState<Leverantör | null>(null);
  const [fakturanummer, setFakturanummer] = useState<string | null>("");
  const [fakturadatum, setFakturadatum] = useState<string | null>("");
  const [förfallodatum, setFörfallodatum] = useState<string | null>("");
  const [betaldatum, setBetaldatum] = useState<string | null>("");

  // Hämta leverantörsdata om leverantorId finns
  useEffect(() => {
    if (leverantorId && levfaktMode) {
      const fetchLeverantör = async () => {
        const result = await getLeverantörer();
        if (result.success) {
          const foundLeverantör = result.leverantörer?.find((l) => l.id === leverantorId);
          if (foundLeverantör) {
            setLeverantör(foundLeverantör);
          }
        }
      };
      fetchLeverantör();
    }
  }, [leverantorId, levfaktMode]);

  // Kundfaktura-specifika states
  const [bokförSomFaktura, setBokförSomFaktura] = useState<boolean>(false);
  const [kundfakturadatum, setKundfakturadatum] = useState<string | null>(null);

  return (
    <MainLayout>
      {currentStep === 1 && (
        <SökFörval
          favoritFörvalen={favoritFörvalen}
          setCurrentStep={setCurrentStep}
          setvaltFörval={setValtFörval}
          setKontonummer={setKontonummer}
          setKontobeskrivning={setKontobeskrivning}
          levfaktMode={levfaktMode}
        />
      )}

      {currentStep === 2 && !levfaktMode && (
        <Steg2
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
          utlaggMode={utlaggMode}
          bokförSomFaktura={bokförSomFaktura}
          setBokförSomFaktura={setBokförSomFaktura}
          kundfakturadatum={kundfakturadatum}
          setKundfakturadatum={setKundfakturadatum}
        />
      )}

      {currentStep === 2 && levfaktMode && (
        <Steg2Levfakt
          favoritFörvalen={favoritFörvalen}
          setCurrentStep={setCurrentStep}
          setKontonummer={setKontonummer}
          setKontobeskrivning={setKontobeskrivning}
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
          setValtFörval={setValtFörval}
          extrafält={extrafält}
          setExtrafält={setExtrafält}
          utlaggMode={utlaggMode}
          // Leverantörsfaktura-specifika props
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
          setCurrentStep={setCurrentStep}
          extrafält={extrafält}
          utlaggMode={utlaggMode}
          levfaktMode={levfaktMode}
          // Leverantörsfaktura-specifika props
          leverantör={leverantör}
          fakturanummer={fakturanummer}
          fakturadatum={fakturadatum}
          förfallodatum={förfallodatum}
          betaldatum={betaldatum}
          // Kundfaktura-specifika props
          bokförSomFaktura={bokförSomFaktura}
          kundfakturadatum={kundfakturadatum}
        />
      )}

      {currentStep === 4 && <Steg4 />}
    </MainLayout>
  );
}
