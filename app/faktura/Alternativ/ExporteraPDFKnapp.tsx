"use client";

import Knapp from "../../_components/Knapp";
import Toast from "../../_components/Toast";
import { ExporteraPDFKnappProps } from "../_types/types";
import { useFaktura } from "../_hooks/useFaktura";

export default function ExporteraPDFKnapp({
  disabled = false,
  text = "📤 Spara PDF",
  className = "",
}: ExporteraPDFKnappProps) {
  const { handleExportPDF, toastState, clearToast } = useFaktura();

  return (
    <>
      <Knapp onClick={handleExportPDF} text={text} disabled={disabled} className={className} />
      {toastState.isVisible && (
        <Toast
          message={toastState.message}
          type={toastState.type}
          isVisible={toastState.isVisible}
          onClose={clearToast}
        />
      )}
    </>
  );
}
