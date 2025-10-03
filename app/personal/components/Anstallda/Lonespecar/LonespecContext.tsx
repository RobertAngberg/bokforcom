"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type { Lönespec, LonespecContextType, ExtraradData } from "../../../types/types";

const LonespecContext = createContext<LonespecContextType | undefined>(undefined);

export const useLonespecContext = () => {
  const ctx = useContext(LonespecContext);
  if (!ctx) throw new Error("useLonespecContext måste användas inom LönespecProvider");
  return ctx;
};

export const LönespecProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lönespecar, setLonespecar] = useState<Lönespec[]>([]);
  const [extrarader, setExtraraderState] = useState<Record<string, ExtraradData[]>>({});
  const [beräknadeVärden, setBeräknadeVärdenState] = useState<
    Record<string, Record<string, unknown>>
  >({});

  const setExtrarader = useCallback((id: string, extrarader: ExtraradData[]) => {
    setExtraraderState((prev) => ({ ...prev, [id]: extrarader }));
  }, []);

  const setBeräknadeVärden = useCallback((id: string, värden: Record<string, unknown>) => {
    setBeräknadeVärdenState((prev) => ({ ...prev, [id]: värden }));
  }, []);

  return (
    <LonespecContext.Provider
      value={{
        lönespecar,
        setLonespecar,
        extrarader,
        setExtrarader,
        beräknadeVärden,
        setBeräknadeVärden,
      }}
    >
      {children}
    </LonespecContext.Provider>
  );
};
