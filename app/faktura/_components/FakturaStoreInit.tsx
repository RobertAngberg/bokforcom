"use client";

import { useEffect } from "react";
import { useFakturaStore } from "../_stores/fakturaStore";
import type { FakturaStoreInitProps } from "../_types/types";

export default function FakturaStoreInit({ initialData }: FakturaStoreInitProps) {
  const initStore = useFakturaStore((state) => state.initStore);

  useEffect(() => {
    initStore(initialData);
  }, [initialData, initStore]);

  return null;
}
