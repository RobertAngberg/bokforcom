import { useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import type {
  AnställdListItem,
  ExtraradData,
  Lönespec,
  Företagsprofil,
  BeräknadeVärden,
  ForhandsgranskningComponent,
  UseMailaLonespecProps,
} from "../types/types";
import { showToast } from "../../_components/Toast";

export function useMailaLonespec({
  lönespec,
  anställd,
  företagsprofil,
  extrarader = [],
  beräknadeVärden = {},
  open = false,
  onMailComplete,
  onClose,
  ForhandsgranskningComponent,
}: UseMailaLonespecProps) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(open);

  // Update modal state when open prop changes
  useState(() => {
    setShowModal(open);
  });

  // PDF generation logic - moved to external function to avoid JSX in .ts file
  const generatePDF = async (
    item: {
      lönespec: Lönespec;
      anställd: AnställdListItem;
      företagsprofil: Företagsprofil | null;
      extrarader: ExtraradData[];
      beräknadeVärden: BeräknadeVärden;
    },
    ForhandsgrankningComponent: ForhandsgranskningComponent
  ): Promise<Blob> => {
    let reactRoot: Root | null = null;
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-9999px";
    document.body.appendChild(container);

    try {
      const { createElement } = await import("react");
      reactRoot = createRoot(container);

      // Ensure we have valid defaults that match types
      const defaultAnställd: AnställdListItem = {
        id: 0,
        namn: "",
        epost: "",
      };

      const component = createElement(ForhandsgrankningComponent, {
        lönespec: item.lönespec,
        anställd: item.anställd || defaultAnställd,
        företagsprofil: item.företagsprofil ?? null,
        extrarader: item.extrarader || [],
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
  const sendEmail = async (
    item: {
      lönespec?: Lönespec;
      anställd?: AnställdListItem;
      företagsprofil?: Företagsprofil | null;
      extrarader?: ExtraradData[];
      beräknadeVärden?: BeräknadeVärden;
    },
    pdfBlob: Blob
  ): Promise<void> => {
    const mail = item.anställd?.mail || item.anställd?.epost || item.anställd?.email || "";
    if (!mail) {
      const anställdNamn =
        item.anställd?.namn ||
        `${item.anställd?.förnamn || ""} ${item.anställd?.efternamn || ""}`.trim() ||
        "Anställd";
      throw new Error(`Ingen e-postadress för ${anställdNamn}`);
    }

    const formData = new FormData();
    const pdfFile = new File([pdfBlob], "lonespec.pdf", { type: "application/pdf" });
    formData.append("pdf", pdfFile);
    formData.append("email", mail);

    // Använd det fullständiga namnet från anställd.namn eller fallback till för+efternamn
    const fullNameFromNamn = (item.anställd?.namn || "").toString().trim();
    const firstName = (item.anställd?.förnamn || "").toString().trim();
    const lastName = (item.anställd?.efternamn || "").toString().trim();

    let finalName = "";
    if (fullNameFromNamn) {
      finalName = fullNameFromNamn;
    } else {
      const nameParts = [firstName, lastName].filter((name) => name.length > 0);
      finalName = nameParts.length > 0 ? nameParts.join(" ") : "Anställd";
    }

    formData.append("namn", finalName);

    const res = await fetch("/api/email/send-lonespec", { method: "POST", body: formData });
    if (!res.ok) {
      throw new Error(`Kunde inte skicka e-post till ${mail}`);
    }
  };

  // Mail logic - single lönespec only
  const handleMaila = async (ForhandsgrankningComponent: ForhandsgranskningComponent) => {
    setLoading(true);
    setError(null);

    try {
      // Validate all required fields exist
      if (!lönespec || !anställd || !företagsprofil || !beräknadeVärden) {
        throw new Error("Saknar nödvändig data för att skicka lönespec");
      }

      const singleItem = {
        lönespec,
        anställd,
        företagsprofil,
        extrarader: extrarader || [],
        beräknadeVärden,
      };

      const pdfBlob = await generatePDF(singleItem, ForhandsgrankningComponent);
      await sendEmail(singleItem, pdfBlob);

      setSent(true);
      showToast("Lönespec skickad!", "success");

      // Close modal after showing toast
      setTimeout(() => {
        onMailComplete?.();
        onClose?.();
      }, 2000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Något gick fel.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Ready-to-use handler with component bound
  const handleMailaWithComponent = ForhandsgranskningComponent
    ? () => handleMaila(ForhandsgranskningComponent)
    : () => {};

  const openModal = () => setShowModal(true);
  const closeModal = () => {
    setShowModal(false);
    onClose?.();
  };

  return {
    // State
    loading,
    sent,
    error,
    showModal,

    // Actions
    handleMaila: handleMailaWithComponent,
    openModal,
    closeModal,

    // Utilities
    generatePDF,
    sendEmail,
  };
}
