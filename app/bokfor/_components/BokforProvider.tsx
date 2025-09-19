"use client";

import { createContext, useContext, ReactNode } from "react";
import { useBokfor } from "../_hooks/useBokfor";

interface BokforContextType {
  state: ReturnType<typeof useBokfor>["state"];
  actions: ReturnType<typeof useBokfor>["actions"];
  handlers: ReturnType<typeof useBokfor>["handlers"];
  formatKontoValue: ReturnType<typeof useBokfor>["formatKontoValue"];
  getCardClassName: ReturnType<typeof useBokfor>["getCardClassName"];
  options: ReturnType<typeof useBokfor>["options"];
}

const BokforContext = createContext<BokforContextType | null>(null);

interface BokforProviderProps {
  children: ReactNode;
}

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
