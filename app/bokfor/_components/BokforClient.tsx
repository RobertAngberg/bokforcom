"use client";

import { useEffect } from "react";
import { useBokforContext } from "./BokforProvider";
import SökFörval from "./SokForval";
import Steg2 from "./Steg/Steg2";
import Steg2Levfakt from "./Steg/Steg2Levfakt";
import Steg3 from "./Steg/Steg3";
import Steg4 from "./Steg/Steg4";

interface BokforClientProps {
  initialData: {
    favoritFörval: any[];
    allaFörval: any[];
    bokföringsmetod: string;
    anställda: any[];
  };
}

export default function BokforClient({ initialData }: BokforClientProps) {
  const { actions } = useBokforContext();

  // Initialisera data vid mount
  useEffect(() => {
    if (initialData) {
      actions.setFavoritFörvalen(initialData.favoritFörval);
      actions.setAllaFörval(initialData.allaFörval);
      actions.setBokföringsmetod(initialData.bokföringsmetod);
      actions.setAnställda(initialData.anställda);
    }
  }, [initialData, actions]);

  return (
    <>
      <SökFörval />
      <Steg2 />
      <Steg2Levfakt />
      <Steg3 />
      <Steg4 />
    </>
  );
}
