"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getLeverantörer, type Leverantör } from "../../faktura/actions";
import { fetchFavoritforval } from "../_actions/actions";
import { Förval, PageProps } from "../_types/types";

export function useBokfor(searchParams: PageProps["searchParams"]) {
  const router = useRouter();

  // State variables
  const [favoritFörvalen, setFavoritFörvalen] = useState<Förval[]>([]);
  const [isLevfaktMode, setIsLevfaktMode] = useState(false);
  const [isUtlaggMode, setIsUtlaggMode] = useState(false);
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

  // Load initial data effect
  useEffect(() => {
    const loadData = async () => {
      const params = await searchParams;
      const levfaktMode = params.levfakt === "true";
      const utlaggMode = params.utlagg === "true";
      const leverantorIdParam = params.leverantorId
        ? parseInt(params.leverantorId as string)
        : null;

      setIsLevfaktMode(levfaktMode);
      setIsUtlaggMode(utlaggMode);
      setLeverantorId(leverantorIdParam);

      const favoritData = await fetchFavoritforval();
      setFavoritFörvalen(favoritData);
    };

    loadData();
  }, [searchParams]);

  // Fetch leverantör when leverantorId changes
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

  // Handler functions
  const handleSetCurrentStep = (step: number) => {
    if (step === 1) {
      // Återställ levfakt-läge så att standard Steg2 med checkbox kan visas igen
      setIsLevfaktMode(false);
      setLeverantör(null);
      setLeverantorId(null);
      // Ta bort ev. query params levfakt & leverantorId
      router.replace("/bokfor");
    }
    setCurrentStep(step);
  };

  const exitLevfaktMode = () => {
    setIsLevfaktMode(false);
    setLeverantör(null);
    setLeverantorId(null);
    // Rensa query params och stanna kvar i steg 2
    router.replace("/bokfor?step=2");
  };

  return {
    // State
    favoritFörvalen,
    setFavoritFörvalen,
    isLevfaktMode,
    setIsLevfaktMode,
    isUtlaggMode,
    setIsUtlaggMode,
    leverantorId,
    setLeverantorId,
    currentStep,
    setCurrentStep,
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

    // Handlers
    handleSetCurrentStep,
    exitLevfaktMode,
  };
}
