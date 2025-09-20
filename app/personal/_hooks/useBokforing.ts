"use client";

import { usePersonalContext } from "../_context/PersonalContext";

export function useBokforing() {
  const {
    state: { bokföringRegler, bokföringTransaktioner, bokföringLoading },
    setBokföringRegler,
    setBokföringTransaktioner,
    setBokföringLoading,
  } = usePersonalContext();

  return {
    bokföringRegler,
    bokföringTransaktioner,
    bokföringLoading,
    setBokföringRegler,
    setBokföringTransaktioner,
    setBokföringLoading,
  };
}
