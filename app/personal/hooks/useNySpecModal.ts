import { useState, useEffect } from "react";
import { skapaNyLönespec } from "../actions/lonespecarActions";
import { showToast } from "../../_components/Toast";

interface UseNySpecModalProps {
  isOpen: boolean;
  onClose: () => void;
  nySpecDatum: Date | null;
  setNySpecDatum: (date: Date | null) => void;
  anstallda: any[];
  onSpecCreated: () => void;
}

export function useNySpecModal({
  isOpen,
  onClose,
  nySpecDatum,
  setNySpecDatum,
  anstallda,
  onSpecCreated,
}: UseNySpecModalProps) {
  // State
  const [valdAnställd, setValdAnställd] = useState<string>("");

  // Effects
  useEffect(() => {
    if (isOpen) {
      setValdAnställd("");
    }
  }, [isOpen]);

  // Validation
  const validateInput = () => {
    if (!nySpecDatum) {
      showToast("Välj ett datum först!", "error");
      return false;
    }
    if (!valdAnställd) {
      showToast("Välj en anställd först!", "error");
      return false;
    }
    if (anstallda.length === 0) {
      showToast("Ingen anställd hittades.", "error");
      return false;
    }
    return true;
  };

  const formatUtbetalningsdatum = () => {
    if (nySpecDatum instanceof Date && !isNaN(nySpecDatum.getTime())) {
      return nySpecDatum.toISOString().slice(0, 10);
    }
    return null;
  };

  // Handlers
  const handleCreateSpec = async () => {
    if (!validateInput()) return;

    const utbetalningsdatum = formatUtbetalningsdatum();
    if (!utbetalningsdatum) {
      showToast("Fel: utbetalningsdatum saknas eller är ogiltigt!", "error");
      return;
    }

    try {
      const res = await skapaNyLönespec({
        anställd_id: parseInt(valdAnställd),
        utbetalningsdatum,
      });

      if (res?.success === false) {
        showToast(`Fel: ${res.error || "Misslyckades att skapa lönespecifikation."}`, "error");
      } else {
        showToast("Ny lönespecifikation skapad!", "success");
        onClose();
        onSpecCreated();
      }
    } catch (error) {
      console.error("❌ Fel vid skapande av lönespec:", error);
      showToast("Ett oväntat fel inträffade", "error");
    }
  };

  const handleAnställdChange = (value: string) => {
    setValdAnställd(value);
  };

  const handleDatumChange = (date: Date | null) => {
    setNySpecDatum(date);
  };

  return {
    // State
    valdAnställd,

    // Computed
    canCreate: !!nySpecDatum && !!valdAnställd && anstallda.length > 0,

    // Handlers
    handleCreateSpec,
    handleAnställdChange,
    handleDatumChange,
  };
}
