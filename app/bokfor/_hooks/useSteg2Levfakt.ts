"use client";

import { useEffect, useState } from "react";
import { datePickerOnChange } from "../../_utils/trueDatum";

export function useSteg2Levfakt({
  fakturadatum,
  setFakturadatum,
  förfallodatum,
  setFörfallodatum,
  betaldatum,
  setBetaldatum,
}: {
  fakturadatum?: string | null;
  setFakturadatum?: (datum: string | null) => void;
  förfallodatum?: string | null;
  setFörfallodatum?: (datum: string | null) => void;
  betaldatum?: string | null;
  setBetaldatum?: (datum: string | null) => void;
}) {
  const [visaLeverantorModal, setVisaLeverantorModal] = useState(false);

  // Datepicker styling och default värden
  useEffect(() => {
    const datePickerEls = document.querySelectorAll(".react-datepicker-wrapper");
    datePickerEls.forEach((el) => {
      (el as HTMLElement).style.width = "100%";
    });

    const inputEls = document.querySelectorAll(".react-datepicker__input-container input");
    inputEls.forEach((el) => {
      (el as HTMLElement).className =
        "w-full p-2 mb-4 rounded text-white bg-slate-900 border border-gray-700";
    });

    // Sätt default datum
    if (!fakturadatum && setFakturadatum) {
      setFakturadatum(datePickerOnChange(new Date()));
    }
    if (!förfallodatum && setFörfallodatum) {
      // Default 30 dagar från idag
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      setFörfallodatum(datePickerOnChange(thirtyDaysFromNow));
    }
    if (!betaldatum && setBetaldatum) {
      // Default betaldatum till idag
      setBetaldatum(datePickerOnChange(new Date()));
    }
  }, [fakturadatum, förfallodatum, betaldatum, setFakturadatum, setFörfallodatum, setBetaldatum]);

  return {
    visaLeverantorModal,
    setVisaLeverantorModal,
  };
}
