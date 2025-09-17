"use client";

import Knapp from "../../_components/Knapp";
import Toast from "../../_components/Toast";
import { ExporteraPDFKnappProps } from "../_types/types";
import { useExporteraPDFKnapp } from "../_hooks/useExporteraPDFKnapp";

export default function ExporteraPDFKnapp({
  disabled = false,
  text = "📤 Spara PDF",
  className = "",
}: ExporteraPDFKnappProps) {
  const { toast, handleExport, closeToast } = useExporteraPDFKnapp();

  return (
    <>
      <Knapp onClick={handleExport} text={text} disabled={disabled} className={className} />
      {toast.isVisible && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={closeToast}
        />
      )}
    </>
  );
}
