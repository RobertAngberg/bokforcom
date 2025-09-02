"use client";
import { useState } from "react";
import Knapp from "../../_components/Knapp";
import { generatePDFFromElement } from "./pdfGenerator";
import Toast from "../../_components/Toast";

interface ExporteraPDFKnappProps {
  disabled?: boolean;
  text?: string;
  className?: string;
}

export default function ExporteraPDFKnapp({
  disabled = false,
  text = "📤 Spara PDF",
  className = "",
}: ExporteraPDFKnappProps) {
  const [toast, setToast] = useState({
    message: "",
    type: "info" as "success" | "error" | "info",
    isVisible: false,
  });

  const handleExport = async () => {
    try {
      const pdf = await generatePDFFromElement();
      pdf.save("faktura.pdf");
    } catch (error) {
      console.error("❌ Error exporting PDF:", error);
      setToast({
        message: "Kunde inte exportera PDF",
        type: "error",
        isVisible: true,
      });
    }
  };

  return (
    <>
      <Knapp onClick={handleExport} text={text} disabled={disabled} className={className} />
      {toast.isVisible && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
        />
      )}
    </>
  );
}
