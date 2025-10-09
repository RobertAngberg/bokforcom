/**
 * Hook för SIE Data View Management
 *
 * Hanterar:
 * - Active tab state (översikt/konton/verifikationer/balanser/resultat)
 * - Tab navigation
 */

"use client";

import { useState } from "react";

export type SieTab = "översikt" | "konton" | "verifikationer" | "balanser" | "resultat";

export function useSieDataView() {
  const [activeTab, setActiveTab] = useState<SieTab>("översikt");

  const switchTab = (tab: SieTab) => {
    setActiveTab(tab);
  };

  const resetView = () => {
    setActiveTab("översikt");
  };

  return {
    activeTab,
    switchTab,
    resetView,
  };
}
