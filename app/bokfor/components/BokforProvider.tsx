"use client";

import { createContext, useContext } from "react";
import { useBokfor } from "../hooks/useBokfor";
import { BokforContextType, BokforProviderProps } from "../types/types";

const BokforContext = createContext<BokforContextType | null>(null);

export function BokforProvider({ children }: BokforProviderProps) {
  const bokforHook = useBokfor();

  return <BokforContext.Provider value={bokforHook}>{children}</BokforContext.Provider>;
}

export function useBokforContext(): BokforContextType {
  const context = useContext(BokforContext);
  if (!context) {
    throw new Error("useBokforContext must be used within a BokforProvider");
  }
  return context;
}
