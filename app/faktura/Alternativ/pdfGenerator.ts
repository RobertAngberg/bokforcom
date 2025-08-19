import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export interface PDFGenerationOptions {
  elementId?: string;
  scale?: number;
  quality?: number;
  backgroundColor?: string;
}

export async function generatePDFFromElement(options: PDFGenerationOptions = {}): Promise<jsPDF> {
  const {
    elementId = "print-area",
    scale = 2,
    quality = 0.9,
    backgroundColor = "#ffffff",
  } = options;

  const element = document.getElementById(elementId);

  if (!element) {
    throw new Error(`Element med ID "${elementId}" hittades inte`);
  }

  // Skapa en wrapper för klonen
  const cloneWrapper = document.createElement("div");
  cloneWrapper.style.position = "fixed";
  cloneWrapper.style.top = "0";
  cloneWrapper.style.left = "0";
  cloneWrapper.style.width = "auto";
  cloneWrapper.style.height = "auto";
  cloneWrapper.style.opacity = "0";
  cloneWrapper.style.pointerEvents = "none";
  cloneWrapper.style.zIndex = "-1";
  cloneWrapper.style.background = "#fff";

  // Klona print-ytan
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.display = "block";

  // Hitta företagsdelen i klonen och sätt style direkt
  const företagDiv = clone.querySelector(".faktura-företag") as HTMLElement;
  if (företagDiv) {
    // Byt ut <br> mot <div> för varje rad om det finns <br>
    if (företagDiv.innerHTML.includes("<br")) {
      const lines = företagDiv.innerHTML
        .split(/<br\s*\/?>/i)
        .map((line) => line.trim())
        .filter(Boolean);
      företagDiv.innerHTML = lines.map((line) => `<div>${line}</div>`).join("");
    }
    företagDiv.style.lineHeight = "1";
    företagDiv.style.marginBottom = "0";
    Array.from(företagDiv.children).forEach((child) => {
      if (child instanceof HTMLElement) {
        child.style.margin = "0";
        child.style.padding = "0";
      }
    });
  }

  // Lägg även till en <style> som backup
  const style = document.createElement("style");
  style.innerHTML = `
    .faktura-företag {
      line-height: 1 !important;
      margin-bottom: 0 !important;
    }
    .faktura-företag p,
    .faktura-företag div,
    .faktura-företag span {
      margin: 0 !important;
      padding: 0 !important;
    }
  `;
  clone.prepend(style);

  cloneWrapper.appendChild(clone);
  document.body.appendChild(cloneWrapper);

  try {
    // Vänta lite för att säkerställa att DOM:en är redo
    await new Promise((resolve) => setTimeout(resolve, 100));

    const canvas = await html2canvas(clone, {
      scale,
      useCORS: true,
      logging: false,
      backgroundColor,
    });

    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error(`Canvas har ogiltiga dimensioner: ${canvas.width}x${canvas.height}`);
    }

    const imgData = canvas.toDataURL("image/jpeg", quality);
    const pdf = new jsPDF("p", "mm", "a4");
    const width = 210; // A4 width in mm
    const height = (canvas.height * width) / canvas.width;

    pdf.addImage(imgData, "JPEG", 0, 0, width, height);

    return pdf;
  } finally {
    // Rensa upp DOM-elementet
    if (cloneWrapper.parentNode) {
      document.body.removeChild(cloneWrapper);
    }
  }
}

// Hjälpfunktion för att få PDF som base64
export async function generatePDFAsBase64(options?: PDFGenerationOptions): Promise<string> {
  const pdf = await generatePDFFromElement(options);
  return pdf.output("datauristring").split(",")[1];
}
