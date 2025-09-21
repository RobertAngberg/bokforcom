"use client";

import { AGIGeneratorProps } from "../../../types/types";
import { useLonekorning } from "../../../hooks/useLonekorning";

// Minimal wrapper: delegating till hooken, ingen affärslogik här.
export default function AGIGenerator(props: AGIGeneratorProps) {
  const { generateAGI } = useLonekorning();

  const hanteraAGI = async () => {
    await generateAGI({
      valdaSpecar: props.valdaSpecar,
      anstallda: props.anstallda,
      beräknadeVärden: props.beräknadeVärden,
      extrarader: props.extrarader,
      utbetalningsdatum: props.utbetalningsdatum,
      session: props.session,
      hämtaFöretagsprofil: props.hämtaFöretagsprofil,
      onAGIComplete: props.onAGIComplete,
    });
  };

  return { hanteraAGI };
}
