"use client";

import { useState } from "react";
import { useBokforStore } from "../_stores/bokforStore";
import { UtlaggAnställd } from "../_types/types";

export function useUtlagg({
  initialValue = false,
  onUtläggChange,
}: {
  initialValue?: boolean;
  onUtläggChange?: (isUtlägg: boolean, valdaAnställda: number[]) => void;
}) {
  const anställdaFromStore = useBokforStore((state) => state.anställda);

  const [isUtlägg, setIsUtlägg] = useState(initialValue);
  const [anställda, setAnställda] = useState<UtlaggAnställd[]>([]);
  const [valdaAnställda, setValdaAnställda] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const handleUtläggChange = (checked: boolean) => {
    setIsUtlägg(checked);

    if (checked) {
      setLoading(true);
      // Använd anställda från store
      setAnställda(anställdaFromStore || []);
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
