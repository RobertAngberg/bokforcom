import { useState } from "react";
import { useRouter } from "next/navigation";
import { Förval } from "../_types/types";

interface InitialData {
  favoritFörvalen: Förval[];
  currentStep: number;
  isLevfaktMode: boolean;
  isUtlaggMode: boolean;
  leverantör: any;
}

export function useBokfor(initialData: InitialData) {
  const router = useRouter();

  // State variables - initiera med data från server
  const [favoritFörvalen] = useState<Förval[]>(initialData.favoritFörvalen);
  const [isLevfaktMode, setIsLevfaktMode] = useState(initialData.isLevfaktMode);
  const [isUtlaggMode] = useState(initialData.isUtlaggMode);
  const [currentStep, setCurrentStep] = useState(initialData.currentStep);
  const [leverantör, setLeverantör] = useState(initialData.leverantör);

  // Form state variables
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
  const [fakturanummer, setFakturanummer] = useState<string | null>("");
  const [fakturadatum, setFakturadatum] = useState<string | null>("");
  const [förfallodatum, setFörfallodatum] = useState<string | null>("");
  const [betaldatum, setBetaldatum] = useState<string | null>("");
  const [bokförSomFaktura, setBokförSomFaktura] = useState(false);
  const [kundfakturadatum, setKundfakturadatum] = useState<string | null>("");

  // Handler functions
  const handleSetCurrentStep = (step: number) => {
    if (step === 1) {
      // Återställ levfakt-läge så att standard Steg2 med checkbox kan visas igen
      setIsLevfaktMode(false);
      setLeverantör(null);
      // Ta bort ev. query params levfakt & leverantorId
      router.replace("/bokfor");
    }
    setCurrentStep(step);
  };

  const exitLevfaktMode = () => {
    setIsLevfaktMode(false);
    setLeverantör(null);
    // Rensa query params och stanna kvar i steg 2
    router.replace("/bokfor?step=2");
  };

  return {
    // State
    favoritFörvalen,
    isLevfaktMode,
    setIsLevfaktMode,
    isUtlaggMode,
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
