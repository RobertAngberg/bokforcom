import { useState, useEffect } from "react";
import { skapaNyLönespec } from "../actions/lonespecarActions";

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
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [valdAnställd, setValdAnställd] = useState<string>("");

  // Effects
  useEffect(() => {
    if (isOpen) {
      setValdAnställd("");
      setToast(null);
    }
  }, [isOpen]);

  // Validation
  const validateInput = () => {
    if (!nySpecDatum) {
      setToast({ type: "error", message: "Välj ett datum först!" });
      return false;
    }
    if (!valdAnställd) {
      setToast({ type: "error", message: "Välj en anställd först!" });
      return false;
    }
    if (anstallda.length === 0) {
      setToast({ type: "error", message: "Ingen anställd hittades." });
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
      setToast({ type: "error", message: "Fel: utbetalningsdatum saknas eller är ogiltigt!" });
      return;
    }

    try {
      const res = await skapaNyLönespec({
        anställd_id: parseInt(valdAnställd),
        utbetalningsdatum,
      });

      if (res?.success === false) {
        setToast({
          type: "error",
          message: `Fel: ${res.error || "Misslyckades att skapa lönespecifikation."}`,
        });
      } else {
        setToast({ type: "success", message: "Ny lönespecifikation skapad!" });
        onClose();
        onSpecCreated();
      }
    } catch (error) {
      console.error("❌ Fel vid skapande av lönespec:", error);
      setToast({ type: "error", message: "Ett oväntat fel inträffade" });
    }
  };

  const handleAnställdChange = (value: string) => {
    setValdAnställd(value);
  };

  const handleDatumChange = (date: Date | null) => {
    setNySpecDatum(date);
  };

  const handleCloseToast = () => {
    setToast(null);
  };

  return {
    // State
    toast,
    valdAnställd,

    // Computed
    canCreate: !!nySpecDatum && !!valdAnställd && anstallda.length > 0,

    // Handlers
    handleCreateSpec,
    handleAnställdChange,
    handleDatumChange,
    handleCloseToast,
  };
}
