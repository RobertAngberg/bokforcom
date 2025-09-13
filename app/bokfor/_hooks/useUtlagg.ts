"use client";

import { useState } from "react";
import { hämtaAnställda } from "../_actions/actions";
import { UtlaggAnställd } from "../_types/types";

export function useUtlagg({
  initialValue = false,
  onUtläggChange,
}: {
  initialValue?: boolean;
  onUtläggChange?: (isUtlägg: boolean, valdaAnställda: number[]) => void;
}) {
  const [isUtlägg, setIsUtlägg] = useState(initialValue);
  const [anställda, setAnställda] = useState<UtlaggAnställd[]>([]);
  const [valdaAnställda, setValdaAnställda] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const handleUtläggChange = async (checked: boolean) => {
    setIsUtlägg(checked);

    if (checked) {
      setLoading(true);
      try {
        const anställdaData = await hämtaAnställda();
        setAnställda(anställdaData || []);
      } catch (error) {
        console.error("❌ Fel vid hämtning av anställda:", error);
        setAnställda([]);
      }
      setLoading(false);
    } else {
      setAnställda([]);
      setValdaAnställda([]);
    }

    onUtläggChange?.(checked, checked ? valdaAnställda : []);
  };

  const handleAnställdChange = (anställdId: number, checked: boolean) => {
    const nyaValda = checked
      ? [...valdaAnställda, anställdId]
      : valdaAnställda.filter((id) => id !== anställdId);

    setValdaAnställda(nyaValda);
    onUtläggChange?.(isUtlägg, nyaValda);
  };

  return {
    isUtlägg,
    anställda,
    valdaAnställda,
    loading,
    handleUtläggChange,
    handleAnställdChange,
  };
}
