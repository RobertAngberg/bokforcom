"use client";

import { generatePDFFromElement } from "../Alternativ/pdfGenerator";
import { useFakturaClient } from "./useFakturaClient";

export function useExporteraPDFKnapp() {
  const { toastState, setToast, clearToast } = useFakturaClient();

  const handleExport = async () => {
    try {
      const pdf = await generatePDFFromElement();
      pdf.save("faktura.pdf");
    } catch (error) {
      console.error("❌ Error exporting PDF:", error);
      setToast({
        message: "Kunde inte exportera PDF",
        type: "error",
      });
    }
  };

  const closeToast = () => {
    clearToast();
  };

  return {
    toast: toastState,
    handleExport,
    closeToast,
  };
}
