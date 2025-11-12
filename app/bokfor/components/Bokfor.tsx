"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import LoadingSpinner from "../../_components/LoadingSpinner";
import { useBokforContext } from "../context/BokforContextProvider";
import { BokforClientProps } from "../types/types";

import SokForval from "./SokForval";

const Steg2 = dynamic(() => import("./Steg/Steg2"), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});

const Steg2Levfakt = dynamic(() => import("./Steg/Steg2Levfakt"), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});

const Steg3 = dynamic(() => import("./Steg/Steg3"), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});

const Steg4 = dynamic(() => import("./Steg/Steg4"), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});

export default function Bokfor({ initialData }: BokforClientProps) {
  const { state, actions } = useBokforContext();
  const {
    setFavoritFörvalen,
    setAllaFörval,
    setBokföringsmetod,
    setAnställda: setAnstallda,
  } = actions;

  useEffect(() => {
    // Initialisera med server data
    setFavoritFörvalen(initialData.favoritFörval);
    setAllaFörval(initialData.allaFörval);
    setBokföringsmetod(initialData.bokföringsmetod);
    setAnstallda(initialData.anställda);
  }, [initialData, setFavoritFörvalen, setAllaFörval, setBokföringsmetod, setAnstallda]);

  // Rendera alla komponenter - de hanterar själva sin visning baserat på currentStep
  return (
    <div>
      <SokForval />
      {state.currentStep === 2 && !state.levfaktMode && <Steg2 />}
      {state.currentStep === 2 && state.levfaktMode && <Steg2Levfakt />}
      {state.currentStep === 3 && <Steg3 />}
      {state.currentStep === 4 && <Steg4 />}
    </div>
  );
}
