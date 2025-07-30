"use client";
import Knapp from "../../_components/Knapp";
import { generatePDFFromElement } from "../../_utils/pdfGenerator";

export default function ExporteraPDFKnapp() {
  const handleExport = async () => {
    try {
      const pdf = await generatePDFFromElement();
      pdf.save("faktura.pdf");
    } catch (error) {
      console.error("❌ Error exporting PDF:", error);
      alert("❌ Kunde inte exportera PDF");
    }
  };

  return <Knapp onClick={handleExport} text="📤 Spara PDF" />;
}
