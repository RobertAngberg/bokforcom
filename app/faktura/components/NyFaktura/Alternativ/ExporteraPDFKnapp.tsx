"use client";

import Knapp from "../../../../_components/Knapp";
import { ExporteraPDFKnappProps } from "../../../types/types";
import { useForhandsgranskning } from "../../../hooks/useForhandsgranskning";

export default function ExporteraPDFKnapp({
  disabled = false,
  text = "📤 Ladda ner PDF",
  className = "",
}: ExporteraPDFKnappProps) {
  const { handleExportPDF } = useForhandsgranskning();

  return (
    <>
      <Knapp onClick={handleExportPDF} text={text} disabled={disabled} className={className} />
    </>
  );
}
