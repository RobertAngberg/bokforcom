"use client";

import { useEffect } from "react";
import { useAdminStore } from "../_stores/adminStore";
import type { AdminInitializerProps } from "../_types/types";

export default function StoreInit({ anvandarInfo, foretagsInfo }: AdminInitializerProps) {
  const initStore = useAdminStore((state) => state.initStore);

  useEffect(() => {
    initStore({
      userInfo: anvandarInfo,
      foretagsInfo: foretagsInfo,
    });
  }, [anvandarInfo, foretagsInfo, initStore]);

  return null; // Renderar inget, bara initialiserar store
}
