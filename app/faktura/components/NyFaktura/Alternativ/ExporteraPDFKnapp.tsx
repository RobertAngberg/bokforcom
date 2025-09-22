"use client";

import Knapp from "../../../../_components/Knapp";
import Toast from "../../../../_components/Toast";
import { ExporteraPDFKnappProps } from "../../../types/types";
import { useFaktura } from "../../../hooks/useFaktura";
import { useForhandsgranskning } from "../../../hooks/useForhandsgranskning";

export default function ExporteraPDFKnapp({
  disabled = false,
  text = "📤 Spara PDF",
  className = "",
}: ExporteraPDFKnappProps) {
  const { handleExportPDF } = useForhandsgranskning();
  const { toastState, clearToast } = useFaktura();

  return (
    <>
      <Knapp onClick={handleExportPDF} text={text} disabled={disabled} className={className} />
      {toastState.isVisible && (
        <Toast message={toastState.message} type={toastState.type} onClose={clearToast} />
      )}
    </>
  );
}
