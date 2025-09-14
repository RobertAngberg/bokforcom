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
  const { initStore, setLevfaktMode } = useBokforStore();

  // Initialisera store en gång med server data
  useEffect(() => {
    initStore({
      favoritFörvalen: initialData.favoritFörvalen,
      levfaktMode: initialData.isLevfaktMode,
      utlaggMode: initialData.isUtlaggMode,
      currentStep: initialData.currentStep,
    });
  }, []); // Bara vid första render

  // State variables som inte är i store än
  const [leverantör, setLeverantör] = useState(initialData.leverantör);

  // Handler functions
  const exitLevfaktMode = () => {
    setLevfaktMode(false);
    setLeverantör(null);
    // Rensa query params och stanna kvar i steg 2
    router.replace("/bokfor?step=2");
  };

  return {
    // Bara det som inte är i store
    leverantör,
    setLeverantör,
    exitLevfaktMode,
  };
}
