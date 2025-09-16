"use client";

import { useEffect } from "react";
import { useBokforStore } from "../_stores/bokforStore";
import type { BokforStoreInitProps } from "../_types/types";

export default function StoreInit({
  favoritFörval,
  allaFörval,
  anställda,
  bokföringsmetod,
}: BokforStoreInitProps) {
  const initStore = useBokforStore((state) => state.initStore);

  useEffect(() => {
    initStore({
      favoritFörval,
      allaFörval,
      anställda,
      bokföringsmetod,
      levfaktMode: false,
      utlaggMode: false,
      currentStep: 1,
    });
  }, [favoritFörval, allaFörval, anställda, bokföringsmetod, initStore]);

  return null; // Renderar inget, bara initialiserar store
}
