"use client";

import { UseKommentarProps } from "../_types/types";

export function useKommentar({ kommentar, setKommentar }: UseKommentarProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setKommentar(e.target.value);
  };

  return {
    handleChange,
  };
}
