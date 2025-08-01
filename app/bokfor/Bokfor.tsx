//#region Huvud
"use client";

import { useState } from "react";
import SökFörval from "./SokForval";
import Steg2 from "./Steg2";
import Steg2Levfakt from "./steg2Levfakt";
import Steg3 from "./Steg3";
import Steg4 from "./Steg4";
import MainLayout from "../_components/MainLayout";
import { registerLocale } from "react-datepicker";
import { sv } from "date-fns/locale/sv";
import "react-datepicker/dist/react-datepicker.css";

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
};
//#endregion

export default function Bokför({
  favoritFörvalen,
  utlaggMode = false,
  levfaktMode = false,
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
        />
      )}

      {currentStep === 2 && levfaktMode && (
        <Steg2Levfakt
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
        />
      )}

      {currentStep === 4 && <Steg4 />}
    </MainLayout>
  );
}
