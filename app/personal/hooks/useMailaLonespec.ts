import { useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { createRoot } from "react-dom/client";
import type { SingleLönespec } from "../types/types";

interface UseMailaLonespecProps {
  // Single mode props
  lönespec?: any;
  anställd?: any;
  företagsprofil?: any;
  extrarader?: any[];
  beräknadeVärden?: any;

  // Batch mode props
  batch?: SingleLönespec[];
  batchMode?: boolean;

  // Callbacks
  onMailComplete?: () => void;
  onClose?: () => void;
}

export function useMailaLonespec({
  lönespec,
  anställd,
  företagsprofil,
  extrarader = [],
  beräknadeVärden = {},
  batch = [],
  batchMode = false,
  onMailComplete,
  onClose,
}: UseMailaLonespecProps) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visaModal, setVisaModal] = useState(false);
  const [toast, setToast] = useState({
    message: "",
    type: "info" as "success" | "error" | "info",
    isVisible: false,
  });

  // Helper for single or batch
  const lönespecList = batchMode
    ? batch
    : [{ lönespec, anställd, företagsprofil, extrarader, beräknadeVärden }];

  // PDF generation logic - moved to external function to avoid JSX in .ts file
  const generatePDF = async (
    item: SingleLönespec,
    ForhandsgrankningComponent: any
  ): Promise<Blob> => {
    let reactRoot: any = null;
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-9999px";
    document.body.appendChild(container);

    try {
      const { createElement } = await import("react");
      reactRoot = createRoot(container);

      const component = createElement(ForhandsgrankningComponent, {
        lönespec: item.lönespec,
        anställd: item.anställd,
        företagsprofil: item.företagsprofil,
        extrarader: item.extrarader,
        beräknadeVärden: item.beräknadeVärden,
        onStäng: () => {},
      });

      reactRoot.render(component);

      // Wait for rendering
      await new Promise((resolve) => setTimeout(resolve, 500));

      const element = container.querySelector("#lonespec-print-area") as HTMLElement;
      if (!element) {
        throw new Error("Kunde inte rendera PDF-innehåll.");
      }

      const canvas = await html2canvas(element, {
        scale: 2, // High quality
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      // Compress image to JPEG with good quality
      const imageData = canvas.toDataURL("image/jpeg", 0.85); // 85% quality
      const pdf = new jsPDF("portrait", "mm", "a4");
      const pdfWidth = 210;
      const imgWidth = pdfWidth - 15;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imageData, "JPEG", 7.5, 5, imgWidth, imgHeight);

      const pdfBlob = pdf.output("blob");
      console.log(`PDF storlek: ${(pdfBlob.size / 1024 / 1024).toFixed(2)}MB`);

      return pdfBlob;
    } finally {
      if (reactRoot) reactRoot.unmount();
      document.body.removeChild(container);
    }
  };

  // Send email with PDF
  const sendEmail = async (item: SingleLönespec, pdfBlob: Blob): Promise<void> => {
    const mail = item.anställd.mail || item.anställd.epost || item.anställd.email || "";
    if (!mail) {
      throw new Error(`Ingen e-postadress för ${item.anställd.förnamn} ${item.anställd.efternamn}`);
    }

    const formData = new FormData();
    const pdfFile = new File([pdfBlob], "lonespec.pdf", { type: "application/pdf" });
    formData.append("pdf", pdfFile);
    formData.append("email", mail);
    formData.append("namn", `${item.anställd.förnamn} ${item.anställd.efternamn}`);

    const res = await fetch("/api/send-lonespec", { method: "POST", body: formData });
    if (!res.ok) {
      throw new Error(`Kunde inte skicka e-post till ${mail}`);
    }
  };

  // Batch mail logic
  const handleBatchMaila = async (ForhandsgrankningComponent: any) => {
    setLoading(true);
    setError(null);
    let sentCount = 0;

    try {
      for (const item of lönespecList) {
        const pdfBlob = await generatePDF(item, ForhandsgrankningComponent);
        await sendEmail(item, pdfBlob);
        sentCount++;
      }

      setSent(true);
      setToast({
        message: `${sentCount} lönespecar skickade!`,
        type: "success",
        isVisible: true,
      });

      // Close modal after showing toast
      setTimeout(() => {
        onMailComplete?.();
        closeModal();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Något gick fel vid utskick av lönespecar.");
    } finally {
      setLoading(false);
    }
  };

  // Single mail logic
  const handleMaila = async (ForhandsgrankningComponent: any) => {
    setLoading(true);
    setError(null);

    try {
      const singleItem = { lönespec, anställd, företagsprofil, extrarader, beräknadeVärden };
      const pdfBlob = await generatePDF(singleItem, ForhandsgrankningComponent);
      await sendEmail(singleItem, pdfBlob);

      setSent(true);
      setToast({
        message: "Lönespec skickad!",
        type: "success",
        isVisible: true,
      });

      // Close modal after showing toast
      setTimeout(() => {
        onMailComplete?.();
        closeModal();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Något gick fel.");
    } finally {
      setLoading(false);
    }
  };

  // Modal control
  const closeModal = () => {
    setVisaModal(false);
    onClose?.();
  };

  const openModal = () => {
    setVisaModal(true);
    setError(null);
    setSent(false);
  };

  return {
    // State
    loading,
    sent,
    error,
    visaModal,
    toast,
    setToast,

    // Computed values
    lönespecList,

    // Actions
    handleBatchMaila,
    handleMaila,
    closeModal,
    openModal,

    // Utilities
    generatePDF,
    sendEmail,
  };
}
