"use client";

import { usePersonalContext } from "../_context/PersonalContext";

export function useUtlagg() {
  const {
    state: { utlägg, utläggLoading, utläggBokföringModal, utbetalningsdatum },
    setUtlägg,
    setUtläggLoading,
    openUtläggBokföringModal,
    closeUtläggBokföringModal,
    setUtbetalningsdatum,
  } = usePersonalContext();

  return {
    utlägg,
    utläggLoading,
    utläggBokföringModal,
    utbetalningsdatum,
    setUtlägg,
    setUtläggLoading,
    openUtläggBokföringModal,
    closeUtläggBokföringModal,
    setUtbetalningsdatum,
  };
}
