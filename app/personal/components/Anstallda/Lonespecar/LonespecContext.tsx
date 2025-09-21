"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type { Lönespec, LonespecContextType } from "../../../types/types";

const LonespecContext = createContext<LonespecContextType | undefined>(undefined);

export const useLonespecContext = () => {
  const ctx = useContext(LonespecContext);
  if (!ctx) throw new Error("useLonespecContext måste användas inom LönespecProvider");
  return ctx;
};

export const LönespecProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lönespecar, setLonespecar] = useState<Lönespec[]>([]);
  const [extrarader, setExtraraderState] = useState<Record<string, any[]>>({});
  const [beräknadeVärden, setBeräknadeVärdenState] = useState<Record<string, any>>({});

  const setExtrarader = useCallback((id: string, extrarader: any[]) => {
    setExtraraderState((prev) => ({ ...prev, [id]: extrarader }));
  }, []);

  const setBeräknadeVärden = useCallback((id: string, värden: any) => {
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
