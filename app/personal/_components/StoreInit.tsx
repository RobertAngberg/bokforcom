"use client";

import { useEffect } from "react";
import { usePersonalStore } from "../_stores/personalStore";
import type { StoreInitProps } from "../_types/types";

export default function StoreInit({ anställda, valdAnställd, utlägg }: StoreInitProps) {
  const initStore = usePersonalStore((state) => state.initStore);

  useEffect(() => {
    initStore({
      anställda: anställda || [],
      valdAnställd: valdAnställd || null,
      utlägg: utlägg || [],
    });
  }, [anställda, valdAnställd, utlägg, initStore]);

  return null; // Renderar inget, bara initialiserar store
}
