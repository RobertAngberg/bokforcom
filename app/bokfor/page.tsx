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
import { fetchFavoritforval } from "./actions";
import { Förval, PageProps } from "./types";

// För React DatePicker
registerLocale("sv", sv);

export default function Page({ searchParams }: PageProps) {
  const [favoritFörvalen, setFavoritFörvalen] = useState<Förval[]>([]);
  const [isLevfaktMode, setIsLevfaktMode] = useState(false);
  const [leverantorId, setLeverantorId] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [kontonummer, setKontonummer] = useState<string>("");
  const [kontobeskrivning, setKontobeskrivning] = useState<string | null>(null);
  const [fil, setFil] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [belopp, setBelopp] = useState<number | null>(null);
  const [transaktionsdatum, setTransaktionsdatum] = useState<string | null>(null);
  const [kommentar, setKommentar] = useState<string | null>(null);
  const [valtFörval, setValtFörval] = useState<Förval | null>(null);
  const [extrafält, setExtrafält] = useState<
    Record<string, { label: string; debet: number; kredit: number }>
  >({});
  const [leverantör, setLeverantör] = useState<Leverantör | null>(null);
  const [fakturanummer, setFakturanummer] = useState<string | null>("");
  const [fakturadatum, setFakturadatum] = useState<string | null>("");
  const [förfallodatum, setFörfallodatum] = useState<string | null>("");
  const [betaldatum, setBetaldatum] = useState<string | null>("");
  const [bokförSomFaktura, setBokförSomFaktura] = useState(false);
  const [kundfakturadatum, setKundfakturadatum] = useState<string | null>("");

  useEffect(() => {
    const loadData = async () => {
      const params = await searchParams;
      const levfaktMode = params.levfakt === "true";
      const leverantorIdParam = params.leverantorId
        ? parseInt(params.leverantorId as string)
        : null;

      setIsLevfaktMode(levfaktMode);
      setLeverantorId(leverantorIdParam);

      const favoritData = await fetchFavoritforval();
      setFavoritFörvalen(favoritData);
    };

    loadData();
  }, [searchParams]);

  // Hämta leverantör när leverantorId ändras
  useEffect(() => {
    const fetchLeverantör = async () => {
      if (leverantorId) {
        try {
          const result = await getLeverantörer();
          if (result.success && result.leverantörer) {
            const valdLeverantör = result.leverantörer.find((l) => l.id === leverantorId);
            setLeverantör(valdLeverantör || null);
          } else {
            setLeverantör(null);
          }
        } catch (error) {
          console.error("Fel vid hämtning av leverantör:", error);
          setLeverantör(null);
        }
      } else {
        setLeverantör(null);
      }
    };

    fetchLeverantör();
  }, [leverantorId]);

  return (
    <MainLayout>
      {currentStep === 1 && (
        <SökFörval
          favoritFörvalen={favoritFörvalen}
          setCurrentStep={setCurrentStep}
          setvaltFörval={setValtFörval}
          setKontonummer={setKontonummer}
          setKontobeskrivning={setKontobeskrivning}
          levfaktMode={isLevfaktMode}
        />
      )}

      {currentStep === 2 && !isLevfaktMode && (
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
          bokförSomFaktura={bokförSomFaktura}
          setBokförSomFaktura={setBokförSomFaktura}
          kundfakturadatum={kundfakturadatum}
          setKundfakturadatum={setKundfakturadatum}
        />
      )}

      {currentStep === 2 && isLevfaktMode && (
        <Steg2Levfakt
          favoritFörvalen={favoritFörvalen}
          setCurrentStep={setCurrentStep}
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
          setCurrentStep={setCurrentStep}
          extrafält={extrafält}
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
    </MainLayout>
  );
}
