"use client";

import SökFörval from "./SokForval";
import Steg2 from "./Steg/Steg2";
import Steg2Levfakt from "./Steg/Steg2Levfakt";
import Steg3 from "./Steg/Steg3";
import Steg4 from "./Steg/Steg4";
import { registerLocale } from "react-datepicker";
import { sv } from "date-fns/locale/sv";
import "react-datepicker/dist/react-datepicker.css";
import { useBokfor } from "../_hooks/useBokfor";
import { useBokforStore } from "../_stores/bokforStore";
import type { BokforClientProps } from "../_types/types";

registerLocale("sv", sv);

export default function BokforClient({ initialData }: BokforClientProps) {
  // Hämta state från Zustand store
  const { currentStep } = useBokforStore();

  // Hämta data från hook (behövs fortfarande för UI-logik)
  const { leverantör, exitLevfaktMode } = useBokfor(initialData);

  // Store-värden används direkt från Zustand
  const { levfaktMode: isLevfaktMode, utlaggMode: isUtlaggMode } = useBokforStore();

  return (
    <>
      {currentStep === 1 && <SökFörval />}

      {currentStep === 2 && !isLevfaktMode && <Steg2 utlaggMode={isUtlaggMode} />}

      {currentStep === 2 && isLevfaktMode && (
        <Steg2Levfakt exitLevfaktMode={exitLevfaktMode} utlaggMode={isUtlaggMode} />
      )}

      {currentStep === 3 && <Steg3 utlaggMode={isUtlaggMode} levfaktMode={isLevfaktMode} />}

      {currentStep === 4 && <Steg4 />}
    </>
  );
}
