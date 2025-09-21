"use client";

import { useState, useEffect } from "react";
import extractTextFromPDF from "pdf-parser-client-side";
import { extractDataFromOCR, extractDataFromOCRLevFakt } from "../actions/ocrActions";
import { compressImageFile } from "../../_utils/blobUpload";
import Tesseract from "tesseract.js";
import { UseLaddaUppFilProps } from "../types/types";

// Säker filvalidering
const ALLOWED_FILE_TYPES = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function validateFile(file: File): { valid: boolean; error?: string } {
  // Kontrollera filstorlek
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Filen är för stor. Max storlek: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  // Kontrollera filtyp
  if (!ALLOWED_FILE_TYPES[file.type as keyof typeof ALLOWED_FILE_TYPES]) {
    return { valid: false, error: "Endast PDF, JPG, PNG och WebP filer är tillåtna" };
  }

  // Kontrollera filnamn för säkra tecken
  const unsafeChars = /[<>:"/\\|?*\x00-\x1f]/;
  if (unsafeChars.test(file.name)) {
    return { valid: false, error: "Filnamnet innehåller ogiltiga tecken" };
  }

  return { valid: true };
}

function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "_") // Ersätt osäkra tecken med underscore
    .substring(0, 100) // Begränsa längd
    .toLowerCase();
}

async function förbättraOchLäsBild(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context inte tillgänglig"));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Kunde inte skapa blob"));
            return;
          }

          Tesseract.recognize(blob, "swe", {
            logger: () => {}, // Inaktivera loggning
          })
            .then(({ data: { text } }) => {
              resolve(text);
            })
            .catch(reject);
        },
        "image/png",
        0.95
      );
    };

    img.onerror = () => reject(new Error("Kunde inte ladda bilden"));
    img.src = URL.createObjectURL(file);
  });
}

export function useLaddaUppFil({
  setFil,
  setPdfUrl,
  setTransaktionsdatum,
  setBelopp,
  fil,
  onOcrTextChange,
  skipBasicAI,
  onReprocessTrigger,
  setLeverantör,
  setFakturadatum,
  setFörfallodatum,
  setFakturanummer,
}: UseLaddaUppFilProps) {
  const [recognizedText, setRecognizedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [timeoutTriggered, setTimeoutTriggered] = useState(false);
  const [toast, setToast] = useState({
    message: "",
    type: "error" as "success" | "error" | "info",
    isVisible: false,
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const originalFile = event.target.files?.[0];
    if (!originalFile) return;

    // Säker filvalidering
    const validation = validateFile(originalFile);
    if (!validation.valid) {
      setToast({
        message: validation.error || "Felaktig fil",
        type: "error",
        isVisible: true,
      });
      event.target.value = ""; // Rensa input
      return;
    }

    // VALIDERA FILSTORLEK FÖRST
    const sizeMB = originalFile.size / (1024 * 1024);

    if (originalFile.type === "application/pdf") {
      const maxPdfMB = 2; // 2MB gräns för PDF
      if (sizeMB > maxPdfMB) {
        console.error(`❌ PDF för stor: ${sizeMB.toFixed(1)}MB (max ${maxPdfMB}MB)`);
        setToast({
          message: `PDF-filen är för stor (${sizeMB.toFixed(1)}MB).\nMaximal tillåten storlek är ${maxPdfMB}MB.`,
          type: "error",
          isVisible: true,
        });
        event.target.value = "";
        return;
      }
    } else if (originalFile.type.startsWith("image/")) {
      const maxImageMB = 10; // 10MB gräns för bilder
      if (sizeMB > maxImageMB) {
        console.error(`❌ Bild för stor: ${sizeMB.toFixed(1)}MB (max ${maxImageMB}MB)`);
        setToast({
          message: `Bilden är för stor (${sizeMB.toFixed(1)}MB).\nMaximal tillåten storlek är ${maxImageMB}MB.`,
          type: "error",
          isVisible: true,
        });
        event.target.value = "";
        return;
      }
    }

    let file = originalFile;

    // Komprimera bilder mjukt - PDF behålls original
    if (originalFile.type.startsWith("image/")) {
      file = await compressImageFile(originalFile);
    } else if (originalFile.type === "application/pdf") {
      file = originalFile;
    } else {
      file = originalFile;
    }

    setIsLoading(true);
    setTimeoutTriggered(false);

    const timeout = setTimeout(() => {
      setIsLoading(false);
      setTimeoutTriggered(true);
    }, 10000);

    try {
      // Spara filen lokalt utan att ladda upp till blob storage än
      setFil(file);
      // Skapa temporär URL för förhandsvisning
      const tempUrl = URL.createObjectURL(file);
      setPdfUrl(tempUrl);
    } catch (error) {
      console.error("Fel vid hantering av fil:", error);
      setIsLoading(false);
      return;
    }

    try {
      let text = "";

      if (file.type === "application/pdf") {
        try {
          // Försök textextraktion först (snabbt för text-baserade PDF:er)
          text = (await extractTextFromPDF(file, "clean")) || "";

          // Om ingen text hittades, acceptera att vi inte kan läsa skannade PDFs
          if (!text || text.trim().length === 0) {
            text = "";
          }
        } catch (pdfError) {
          console.error("❌ PDF textextraktion misslyckades:", pdfError);
          text = "";
        }
      } else if (file.type.startsWith("image/")) {
        text = await förbättraOchLäsBild(file);
      }

      if (!text || text.trim().length === 0) {
        setTimeoutTriggered(true);
        setIsLoading(false);
        clearTimeout(timeout);
        return;
      }

      clearTimeout(timeout);
      setRecognizedText(text);
    } catch (error) {
      console.error("❌ Fel vid textextraktion:", error);
      clearTimeout(timeout);
      setTimeoutTriggered(true);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!recognizedText) return;

    (async () => {
      try {
        // Determine if this is leverantörsfaktura mode
        const isLevfaktMode = !!(
          setLeverantör &&
          setFakturadatum &&
          setFörfallodatum &&
          setFakturanummer
        );

        const parsed = isLevfaktMode
          ? await extractDataFromOCRLevFakt(recognizedText)
          : await extractDataFromOCR(recognizedText);

        if (parsed?.datum) {
          setTransaktionsdatum(parsed.datum);
        }

        if (parsed?.belopp && parsed.belopp > 0) {
          setBelopp(parsed.belopp);
        }

        // Leverantörsfaktura specific fields
        if (isLevfaktMode && parsed) {
          if (parsed.leverantör && setLeverantör) {
            setLeverantör(parsed.leverantör);
          }
          if (parsed.fakturadatum && setFakturadatum) {
            setFakturadatum(parsed.fakturadatum);
          }
          if (parsed.förfallodatum && setFörfallodatum) {
            setFörfallodatum(parsed.förfallodatum);
          }
          if (parsed.fakturanummer && setFakturanummer) {
            setFakturanummer(parsed.fakturanummer);
          }
        }

        if (onOcrTextChange) {
          onOcrTextChange(recognizedText);
        }

        setIsLoading(false);
      } catch (error) {
        console.error("❌ OCR processing fel:", error);
        setIsLoading(false);
      }
    })();
  }, [
    recognizedText,
    setTransaktionsdatum,
    setBelopp,
    onOcrTextChange,
    setLeverantör,
    setFakturadatum,
    setFörfallodatum,
    setFakturanummer,
  ]);

  const clearFile = () => {
    setFil(null as any);
    setPdfUrl("");
    setRecognizedText("");
    setTimeoutTriggered(false);
  };

  return {
    state: {
      recognizedText,
      isLoading,
      timeoutTriggered,
      toast,
    },
    handlers: {
      setToast,
      handleFileChange,
      clearFile,
      validateFile,
      sanitizeFilename,
    },
  };
}
