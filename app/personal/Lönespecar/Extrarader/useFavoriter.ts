"use client";

import { useState, useEffect } from "react";

type FavoritRad = {
  id: string;
  label: string;
  kategori:
    | "static"
    | "sjukfranvaro"
    | "skattadeFormaner"
    | "skattefrittTraktamente"
    | "bilersattning";
};

export function useFavoriter() {
  const [favoriter, setFavoriter] = useState<FavoritRad[]>([]);

  // Ladda favoriter från localStorage
  useEffect(() => {
    const sparadeFavoriter = localStorage.getItem("extrarader-favoriter");
    if (sparadeFavoriter) {
      try {
        setFavoriter(JSON.parse(sparadeFavoriter));
      } catch (error) {
        console.error("Kunde inte ladda favoriter:", error);
        localStorage.removeItem("extrarader-favoriter");
      }
    }
  }, []);

  // Spara favoriter till localStorage
  const sparaFavoriter = (nyaFavoriter: FavoritRad[]) => {
    setFavoriter(nyaFavoriter);
    localStorage.setItem("extrarader-favoriter", JSON.stringify(nyaFavoriter));
  };

  const läggTillFavorit = (rad: FavoritRad) => {
    const nyaFavoriter = [...favoriter.filter((f) => f.id !== rad.id), rad];
    sparaFavoriter(nyaFavoriter);
  };

  const taBortFavorit = (radId: string) => {
    const nyaFavoriter = favoriter.filter((f) => f.id !== radId);
    sparaFavoriter(nyaFavoriter);
  };

  const ärFavorit = (radId: string) => {
    return favoriter.some((f) => f.id === radId);
  };

  const toggleFavorit = (rad: FavoritRad) => {
    if (ärFavorit(rad.id)) {
      taBortFavorit(rad.id);
    } else {
      läggTillFavorit(rad);
    }
  };

  return {
    favoriter,
    läggTillFavorit,
    taBortFavorit,
    ärFavorit,
    toggleFavorit,
  };
}
