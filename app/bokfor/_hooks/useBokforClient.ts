import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBokforStore } from "../_stores/bokforStore";

export function useBokforClient() {
  const router = useRouter();
  const { initStore, setLevfaktMode, currentStep, levfaktMode, utlaggMode } = useBokforStore();

  // Initialisera store med defaults (ingen server data behövs)
  useEffect(() => {
    initStore({
      favoritFörvalen: [], // Tom array som default
      levfaktMode: false, // Default värde
      utlaggMode: false, // Default värde
      currentStep: 1, // Börja på steg 1
    });
  }, []); // Bara en gång

  // State variables som inte är i store än
  const [leverantör, setLeverantör] = useState(null); // Default null

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
