"use client";

import SökFörval from "./SokForval";
import Steg2 from "./Steg/Steg2";
import Steg2Levfakt from "./Steg/Steg2Levfakt";
import Steg3 from "./Steg/Steg3";
import Steg4 from "./Steg/Steg4";
import { registerLocale } from "react-datepicker";
import { sv } from "date-fns/locale/sv";
import "react-datepicker/dist/react-datepicker.css";
import { useBokforClient } from "../_hooks/useBokforClient";
registerLocale("sv", sv);

export default function BokforClient() {
  const { currentStep, isLevfaktMode, isUtlaggMode, exitLevfaktMode } = useBokforClient();
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
