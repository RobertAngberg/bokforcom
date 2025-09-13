"use client";

import { useState, useEffect } from "react";
import extractTextFromPDF from "pdf-parser-client-side";
import { extractDataFromOCRLevFakt } from "../_actions/ocrActions";
import { compressImageFile } from "../../_utils/blobUpload";
import Tesseract from "tesseract.js";
import { UseLaddaUppFilLevfaktProps } from "../_types/types";

// Säker filvalidering (samma som useLaddaUppFil)
const ALLOWED_FILE_TYPES = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Filen är för stor. Max storlek: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  if (!ALLOWED_FILE_TYPES[file.type as keyof typeof ALLOWED_FILE_TYPES]) {
    return { valid: false, error: "Endast PDF, JPG, PNG och WebP filer är tillåtna" };
  }

  const unsafeChars = /[<>:"/\\|?*\x00-\x1f]/;
  if (unsafeChars.test(file.name)) {
    return { valid: false, error: "Filnamnet innehåller ogiltiga tecken" };
  }

  return { valid: true };
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
            logger: () => {},
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

export function useLaddaUppFilLevfakt({
  setFil,
  setPdfUrl,
  setTransaktionsdatum,
  setBelopp,
  fil,
  setLeverantör,
  setFakturadatum,
  setFörfallodatum,
  setFakturanummer,
}: UseLaddaUppFilLevfaktProps) {
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

    console.log("📁 Original fil:", originalFile.name, (originalFile.size / 1024).toFixed(1), "KB");

    // Säker filvalidering
    const validation = validateFile(originalFile);
    if (!validation.valid) {
      setToast({
        message: validation.error || "Felaktig fil",
        type: "error",
        isVisible: true,
      });
      event.target.value = "";
      return;
    }

    // VALIDERA FILSTORLEK FÖRST
    const sizeMB = originalFile.size / (1024 * 1024);

    if (originalFile.type === "application/pdf") {
      const maxPdfMB = 2;
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
      const maxImageMB = 10;
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
      console.log("🖼️ Startar mjuk bildkomprimering...");
      file = await compressImageFile(originalFile);
    } else if (originalFile.type === "application/pdf") {
      console.log(`📄 PDF (${sizeMB.toFixed(1)}MB) - behåller original`);
      file = originalFile;
    } else {
      console.log("📄 Okänd filtyp - behåller original");
    }

    const finalSizeKB = file.size / 1024;
    const finalSizeMB = finalSizeKB / 1024;

    if (finalSizeMB >= 1) {
      console.log(`📊 Slutlig filstorlek: ${finalSizeMB.toFixed(1)}MB`);
    } else {
      console.log(`📊 Slutlig filstorlek: ${finalSizeKB.toFixed(1)}KB`);
    }

    setIsLoading(true);
    setTimeoutTriggered(false);

    const timeout = setTimeout(() => {
      setIsLoading(false);
      setTimeoutTriggered(true);
    }, 10000);

    try {
      setFil(file);
      const tempUrl = URL.createObjectURL(file);
      setPdfUrl(tempUrl);
      console.log("Fil sparad lokalt för förhandsvisning:", file.name);
    } catch (error) {
      console.error("Fel vid hantering av fil:", error);
      setIsLoading(false);
      return;
    }

    try {
      let text = "";

      if (file.type === "application/pdf") {
        try {
          text = (await extractTextFromPDF(file, "clean")) || "";
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
        console.log("🧠 Anropar extractDataFromOCRLevFakt för leverantörsfaktura...");
        const parsed = await extractDataFromOCRLevFakt(recognizedText);

        if (parsed?.leverantör) {
          setLeverantör(parsed.leverantör);
        }

        if (parsed?.belopp && parsed.belopp > 0) {
          setBelopp(parsed.belopp);
        }

        if (parsed?.fakturanummer) {
          setFakturanummer(parsed.fakturanummer);
        }

        if (parsed?.fakturadatum) {
          setFakturadatum(parsed.fakturadatum);
        }

        if (parsed?.förfallodatum) {
          setFörfallodatum(parsed.förfallodatum);
        }

        if (parsed?.betaldatum) {
          setTransaktionsdatum(parsed.betaldatum);
        }

        setIsLoading(false);
      } catch (error) {
        console.error("❌ OCR processing fel:", error);
        setIsLoading(false);
      }
    })();
  }, [
    recognizedText,
    setLeverantör,
    setBelopp,
    setFakturanummer,
    setFakturadatum,
    setFörfallodatum,
    setTransaktionsdatum,
  ]);

  const clearFile = () => {
    setFil(null as any);
    setPdfUrl("");
    setRecognizedText("");
    setTimeoutTriggered(false);
  };

  return {
    recognizedText,
    isLoading,
    timeoutTriggered,
    toast,
    setToast,
    handleFileChange,
    clearFile,
    validateFile,
  };
}
