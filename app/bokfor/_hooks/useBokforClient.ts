import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBokforStore } from "../_stores/bokforStore";
import type { InitialData } from "../_types/types";

export function useBokforClient(initialData: InitialData) {
  const router = useRouter();
  const { initStore, setLevfaktMode, currentStep, levfaktMode, utlaggMode } = useBokforStore();

  // OK, useEffect är tyvärr nödvändigt för att undvika React-errors
  useEffect(() => {
    initStore({
      favoritFörvalen: initialData.favoritFörvalen,
      levfaktMode: initialData.isLevfaktMode,
      utlaggMode: initialData.isUtlaggMode,
      currentStep: initialData.currentStep,
    });
  }, []); // Bara en gång

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
    // Store values
    currentStep,
    isLevfaktMode: levfaktMode,
    isUtlaggMode: utlaggMode,
    // Local state
    leverantör,
    setLeverantör,
    // Functions
    exitLevfaktMode,
  };
}
