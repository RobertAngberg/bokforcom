"use client";

import { useCallback } from "react";
import { useBokforStore } from "../_stores/bokforStore";

interface UseKommentarOptions {
  kommentar?: string | null;
  setKommentar?: (value: string) => void;
}

export function useKommentar(options?: UseKommentarOptions) {
  // Använd props om de finns, annars Zustand store
  const storeData = useBokforStore();

  const kommentar = options?.kommentar ?? storeData.kommentar;
  const setKommentar = options?.setKommentar ?? storeData.setKommentar;

  // Callback för att hantera ändringar
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setKommentar(e.target.value);
    },
    [setKommentar]
  );

  return {
    kommentar,
    handleChange,
  };
}
