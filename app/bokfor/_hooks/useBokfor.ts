import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Förval } from "../_types/types";
import { useBokforStore } from "../_stores/bokforStore";

interface InitialData {
  favoritFörvalen: Förval[];
  currentStep: number;
  isLevfaktMode: boolean;
  isUtlaggMode: boolean;
  leverantör: any;
}

export function useBokfor(initialData: InitialData) {
  const router = useRouter();
  const { setCurrentStep } = useBokforStore();

  // Initialisera store med currentStep från server data
  useEffect(() => {
    setCurrentStep(initialData.currentStep);
  }, [initialData.currentStep, setCurrentStep]);

  // State variables - initiera med data från server
  const [favoritFörvalen] = useState<Förval[]>(initialData.favoritFörvalen);
  const [isLevfaktMode, setIsLevfaktMode] = useState(initialData.isLevfaktMode);
  const [isUtlaggMode] = useState(initialData.isUtlaggMode);
  // const [currentStep, setCurrentStep] = useState(initialData.currentStep); // Nu i store
  const [leverantör, setLeverantör] = useState(initialData.leverantör);

  // Form state variables (ta bort belopp och kommentar - nu i store)
  const [kontonummer, setKontonummer] = useState<string>("");
  const [kontobeskrivning, setKontobeskrivning] = useState<string | null>(null);
  const [fil, setFil] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  // const [belopp, setBelopp] = useState<number | null>(null); // Nu i store
  const [transaktionsdatum, setTransaktionsdatum] = useState<string | null>(null);
  // const [kommentar, setKommentar] = useState<string | null>(null); // Nu i store
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

  // Handler functions (handleSetCurrentStep flyttad till store)

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
    // currentStep, // Nu i store
    // setCurrentStep, // Nu i store
    kontonummer,
    setKontonummer,
    kontobeskrivning,
    setKontobeskrivning,
    fil,
    setFil,
    pdfUrl,
    setPdfUrl,
    // belopp, // Nu i store
    // setBelopp, // Nu i store
    transaktionsdatum,
    setTransaktionsdatum,
    // kommentar, // Nu i store
    // setKommentar, // Nu i store
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
    // handleSetCurrentStep, // Nu i store
    exitLevfaktMode,
  };
}
