"use client";

import { useEffect } from "react";
import { BokforProvider, useBokforContext } from "./BokforProvider";
import { hämtaAllaAnställda } from "../../personal/_actions/anstalldaActions";
import { BokforClientProps } from "../_types/types";

// Importera alla steg-komponenter
import SokForval from "./SokForval";
import Steg2 from "./Steg/Steg2";
import Steg2Levfakt from "./Steg/Steg2Levfakt";
import Steg3 from "./Steg/Steg3";
import Steg4 from "./Steg/Steg4";

function BokforClientInner({ initialData }: BokforClientProps) {
  const { actions } = useBokforContext(); // Använd context istället för direkt hook

  useEffect(() => {
    // Initialisera med server data
    actions.setFavoritFörvalen(initialData.favoritFörval);
    actions.setAllaFörval(initialData.allaFörval);
    actions.setBokföringsmetod(initialData.bokföringsmetod);
    actions.setAnställda(initialData.anställda);
  }, [initialData, actions]);

  // Rendera alla komponenter - de hanterar själva sin visning baserat på currentStep
  return (
    <div>
      <SokForval />
      <Steg2 />
      <Steg2Levfakt />
      <Steg3 />
      <Steg4 />
    </div>
  );
}

export default function BokforClient({ initialData }: BokforClientProps) {
  return (
    <BokforProvider>
      <BokforClientInner initialData={initialData} />
    </BokforProvider>
  );
}
