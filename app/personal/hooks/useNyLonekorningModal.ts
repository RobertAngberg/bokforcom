/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import {
  skapaLönekörning,
  skapaLönespecifikationerFörLönekörning,
} from "../actions/lonekorningActions";
import { hämtaAllaAnställda } from "../actions/anstalldaActions";
import type { AnställdListItem, Lönekörning } from "../types/types";

interface UseNyLonekorningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLonekorningCreated: (lonekorning: Lönekörning) => void;
}

export function useNyLonekorningModal({
  isOpen,
  onClose,
  onLonekorningCreated,
}: UseNyLonekorningModalProps) {
  // State
  const [utbetalningsdatum, setUtbetalningsdatum] = useState<Date | null>(new Date());
  const [loading, setLoading] = useState(false);
  const [anställda, setAnställda] = useState<AnställdListItem[]>([]);
  const [valdaAnställda, setValdaAnställda] = useState<number[]>([]);
  const [steg, setSteg] = useState<"datum" | "anställda">("datum");

  // Effects
  useEffect(() => {
    if (isOpen) {
      loadAnställda();
      setSteg("datum");
      setValdaAnställda([]);
    }
  }, [isOpen]);

  // Functions
  const loadAnställda = async () => {
    try {
      const result = await hämtaAllaAnställda();
      setAnställda(result || []);
    } catch (error) {
      console.error("Fel vid laddning av anställda:", error);
    }
  };

  const handleCreate = async () => {
    if (!utbetalningsdatum) {
      alert("Du måste ange ett utbetalningsdatum!");
      return;
    }

    if (steg === "datum") {
      setSteg("anställda");
      return;
    }

    if (valdaAnställda.length === 0) {
      alert("Du måste välja minst en anställd!");
      return;
    }

    setLoading(true);
    try {
      // Skapa lönekörning med period baserat på utbetalningsdatum
      const period = utbetalningsdatum.toISOString().substring(0, 7); // YYYY-MM
      const lönekörningResult = await skapaLönekörning(period);

      if (!lönekörningResult.success) {
        alert(lönekörningResult.error || "Kunde inte skapa lönekörning");
        return;
      }

      // Skapa lönespecifikationer för valda anställda
      const lönespecResult = await skapaLönespecifikationerFörLönekörning(
        lönekörningResult.data!.id,
        utbetalningsdatum,
        valdaAnställda
      );

      if (!lönespecResult.success) {
        alert(lönespecResult.error || "Kunde inte skapa lönespecifikationer");
        return;
      }

      onLonekorningCreated(lönekörningResult.data!); // Skicka med den skapade lönekörningen
      onClose();
      setUtbetalningsdatum(new Date());
      setSteg("datum");
      setValdaAnställda([]);
    } catch (error) {
      console.error("❌ Fel vid skapande av lönekörning:", error);
      alert("Kunde inte skapa lönekörning");
    } finally {
      setLoading(false);
    }
  };

  const handleAnställdToggle = (anställdId: number) => {
    setValdaAnställda((prev) =>
      prev.includes(anställdId) ? prev.filter((id) => id !== anställdId) : [...prev, anställdId]
    );
  };

  const handleBack = () => {
    if (steg === "anställda") {
      setSteg("datum");
    }
  };

  const handleClose = () => {
    onClose();
  };

  return {
    // State
    utbetalningsdatum,
    setUtbetalningsdatum,
    loading,
    anställda,
    valdaAnställda,
    steg,

    // Computed
    canProceed: steg === "datum" ? !!utbetalningsdatum : valdaAnställda.length > 0,

    // Functions
    handleCreate,
    handleAnställdToggle,
    handleBack,
    handleClose,
  };
}
