import { useState } from "react";
import type { LönespecData, Lönekörning } from "../types/types";

interface UseLonekorningSpecListaProps {
  valdaSpecar: LönespecData[];
  lönekörning: Lönekörning | null;
  onTaBortSpec: (id: number) => Promise<void>;
  onHämtaBankgiro: () => void;
  onMailaSpecar: () => void;
  onBokför: () => void;
  onGenereraAGI: () => void;
  onBokförSkatter: () => void;
}

export function useLonekorningSpecLista({
  valdaSpecar,
  lönekörning,
  onTaBortSpec,
  onHämtaBankgiro,
  onMailaSpecar,
  onBokför,
  onGenereraAGI,
  onBokförSkatter,
}: UseLonekorningSpecListaProps) {
  // State
  const [taBortLaddning, setTaBortLaddning] = useState<Record<number, boolean>>({});

  // Computed values
  const currentStep = lönekörning?.aktuellt_steg || 0;
  const allaHarBankgiro = valdaSpecar.every((spec) => spec.bankgiro_exporterad);
  const allaHarMailats = valdaSpecar.every((spec) => spec.mailad);
  const allaHarBokförts = valdaSpecar.every((spec) => spec.bokförd);

  const lönekörningKomplett = !!(
    lönekörning?.mailade_datum &&
    lönekörning?.bokford_datum &&
    lönekörning?.agi_genererad_datum &&
    lönekörning?.skatter_bokforda_datum
  );

  const hasIncompleteSpecs = valdaSpecar.some((spec) => !spec.bruttolön || !spec.nettolön);

  // Handlers
  const handleTaBortLönespec = async (spec: LönespecData) => {
    if (!confirm("Är du säker på att du vill ta bort denna lönespecifikation?")) return;

    setTaBortLaddning((prev) => ({ ...prev, [spec.id]: true }));
    try {
      await onTaBortSpec(spec.id);
    } catch (error) {
      console.error("❌ Fel vid borttagning av lönespec:", error);
    } finally {
      setTaBortLaddning((prev) => ({ ...prev, [spec.id]: false }));
    }
  };

  const handleHämtaBankgiro = () => {
    onHämtaBankgiro();
  };

  function handleBokför() {
    console.log("🔥 handleBokför anropad!");
    onBokför();
  }

  function handleGenereraAGI() {
    onGenereraAGI();
  }

  const handleBokförSkatter = () => {
    onBokförSkatter();
  };

  // Workflow steps configuration
  const workflowSteps = [
    {
      id: "maila",
      title: "Maila",
      description: "Skicka lönespecar",
      completed: !!lönekörning?.mailade_datum,
      buttonText: "✉️ Maila lönespecar",
      onClick: onMailaSpecar,
      enabled: true, // Första steget är alltid enabled
    },
    {
      id: "bokfor",
      title: "Bokför",
      description: "Registrera i bokföring",
      completed: !!lönekörning?.bokford_datum,
      buttonText: "📖 Bokför",
      onClick: handleBokför,
      enabled: !!lönekörning?.bokford_datum || !!lönekörning?.mailade_datum,
    },
    {
      id: "agi",
      title: "AGI",
      description: "Generera deklaration",
      completed: !!lönekörning?.agi_genererad_datum,
      buttonText: "📊 Generera AGI",
      onClick: handleGenereraAGI,
      enabled: !!lönekörning?.agi_genererad_datum || !!lönekörning?.bokford_datum,
    },
    {
      id: "skatter",
      title: "Skatter",
      description: "Bokför skatter",
      completed: !!lönekörning?.skatter_bokforda_datum,
      buttonText: "💰 Bokför skatter",
      onClick: handleBokförSkatter,
      enabled: !!lönekörning?.skatter_bokforda_datum || !!lönekörning?.agi_genererad_datum,
    },
  ];

  return {
    // State
    taBortLaddning,

    // Computed
    currentStep,
    allaHarBankgiro,
    allaHarMailats,
    allaHarBokförts,
    lönekörningKomplett,
    hasIncompleteSpecs,
    workflowSteps,

    // Handlers
    handleTaBortLönespec,
    handleHämtaBankgiro,
    handleBokför,
    handleGenereraAGI,
    handleBokförSkatter,
  };
}
