"use client";

import { useState, useEffect } from "react";
import extractTextFromPDF from "pdf-parser-client-side";
import { extractDataFromOCR } from "./actions";
import { uploadReceiptImage, uploadBlob, compressImageFile } from "../_utils/blobUpload";
import Tesseract from "tesseract.js";
import Toast from "../_components/Toast";

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

interface FileUploadProps {
  setFil: (file: File | null) => void;
  setPdfUrl: (url: string) => void;
  setTransaktionsdatum: (datum: string) => void;
  setBelopp: (belopp: number) => void;
  fil: File | null;
  onOcrTextChange?: (text: string) => void;
  skipBasicAI?: boolean;
  onReprocessTrigger?: (reprocessFn: () => Promise<void>) => void;
}

export default function LaddaUppFil({
  setFil,
  setPdfUrl,
  setTransaktionsdatum,
  setBelopp,
  fil,
  onOcrTextChange,
  skipBasicAI,
  onReprocessTrigger,
}: FileUploadProps) {
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
        // Rensa input
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
        // Rensa input
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

    // Visa filstorlek efter eventuell komprimering
    const finalSizeKB = file.size / 1024;
    const finalSizeMB = finalSizeKB / 1024;

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
        const parsed = await extractDataFromOCR(recognizedText);

        if (parsed?.datum) {
          setTransaktionsdatum(parsed.datum);
        }

        if (parsed?.belopp && !isNaN(parsed.belopp)) {
          setBelopp(Number(parsed.belopp));
        }
      } catch (error) {
        console.error("❌ OpenAI parsing error:", error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [recognizedText, setBelopp, setTransaktionsdatum]);

  return (
    <>
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />

      <input
        type="file"
        id="fileUpload"
        accept="application/pdf,image/png,image/jpeg"
        onChange={handleFileChange}
        required
        style={{ display: "none" }}
        autoFocus
      />
      <label
        htmlFor="fileUpload"
        className="flex items-center justify-center px-4 py-2 mb-6 font-bold text-white rounded cursor-pointer bg-cyan-600 hover:bg-cyan-700"
      >
        {fil ? `📎 ${fil.name}` : "Ladda upp underlag"}
      </label>

      {isLoading && (
        <div className="flex flex-col items-center justify-center mb-6 text-white">
          <div className="w-6 h-6 mb-2 border-4 rounded-full border-cyan-400 border-t-transparent animate-spin" />
          <span className="text-sm text-cyan-200">Läser och tolkar dokument...</span>
        </div>
      )}

      {timeoutTriggered && (
        <div className="mb-6 text-sm text-center text-yellow-300">
          ⏱️ Tolkningen tog för lång tid – fyll i uppgifterna manuellt.
        </div>
      )}
    </>
  );
}

async function förbättraOchLäsBild(file: File): Promise<string> {
  const img = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("Kunde inte skapa canvas");

  // Bildbearbetning för bättre OCR-läsning
  const scaleFactor = img.width < 800 ? 2 : 1.5;
  canvas.width = img.width * scaleFactor;
  canvas.height = img.height * scaleFactor;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const avg = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
    const bw = avg > 140 ? 255 : 0;
    imageData.data[i] = bw;
    imageData.data[i + 1] = bw;
    imageData.data[i + 2] = bw;
  }
  ctx.putImageData(imageData, 0, 0);

  try {
    // Använd Tesseract.js direkt på den förbättrade bilden
    const {
      data: { text },
    } = await Tesseract.recognize(
      canvas,
      "swe+eng", // Svenska och engelska
      {
        logger: (m) => {
          if (m.status === "recognizing text") {
            // Progress logging removed
          }
        },
      }
    );

    return text;
  } catch (error) {
    console.error("❌ Tesseract OCR fel:", error);
    throw new Error("OCR misslyckades");
  }
}
