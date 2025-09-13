"use client";

import { useState, useEffect } from "react";
import extractTextFromPDF from "pdf-parser-client-side";
import { extractDataFromOCRLevFakt } from "../../_actions/ocrActions";
import { compressImageFile } from "../../../_utils/blobUpload";
import Tesseract from "tesseract.js";
import Toast from "../../../_components/Toast";
import { FileUploadLevfaktProps } from "../../_types/types";

export default function LaddaUppFilLevfakt({
  setFil,
  setPdfUrl,
  setTransaktionsdatum,
  setBelopp,
  fil,
  setLeverantör,
  setFakturadatum,
  setFörfallodatum,
  setFakturanummer,
}: FileUploadLevfaktProps) {
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
      console.log("🖼️ Startar mjuk bildkomprimering...");
      file = await compressImageFile(originalFile);
    } else if (originalFile.type === "application/pdf") {
      console.log(`📄 PDF (${sizeMB.toFixed(1)}MB) - behåller original`);
      file = originalFile;
    } else {
      console.log("📄 Okänd filtyp - behåller original");
    }

    // Visa filstorlek efter eventuell komprimering
    const finalSizeKB = file.size / 1024;
    const finalSizeMB = finalSizeKB / 1024;

    if (finalSizeMB >= 1) {
      console.log(`📊 Slutlig filstorlek: ${finalSizeMB.toFixed(1)}MB`);
    } else {
      console.log(`📊 Slutlig filstorlek: ${finalSizeKB.toFixed(1)}KB`);
    }

    setIsLoading(true);
    setTimeoutTriggered(false);

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

    const timeout = setTimeout(() => {
      console.log("⏰ Timeout efter 10 sekunder!");
      setIsLoading(false);
      setTimeoutTriggered(true);
    }, 10000);

    try {
      let text = "";

      if (file.type === "application/pdf") {
        console.log("🔍 Extraherar text från PDF...");
        try {
          const pdfText = await extractTextFromPDF(file, "clean");
          text = pdfText || "";
          console.log("✅ PDF text extraherad:", text ? `${text.length} tecken` : "tom");
        } catch (pdfError) {
          console.error("❌ PDF extraktion misslyckades:", pdfError);
          text = "";
        }
      } else if (file.type.startsWith("image/")) {
        console.log("🔍 OCR på komprimerad bild...");
        text = await förbättraOchLäsBild(file);
      }

      if (!text || text.trim().length === 0) {
        console.log("⚠️ Ingen text extraherad från fil");
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
        console.log("📄 Parsed leverantörsfaktura data:", parsed);

        // Fyll i alla fält automatiskt
        // TODO: Uppdatera när OCR returnerar Leverantör-objekt istället för string
        // if (parsed?.leverantör) {
        //   setLeverantör(parsed.leverantör);
        // }

        if (parsed?.fakturadatum) {
          setFakturadatum(parsed.fakturadatum);
        }

        if (parsed?.förfallodatum) {
          setFörfallodatum(parsed.förfallodatum);
        }

        if (parsed?.fakturanummer) {
          setFakturanummer(parsed.fakturanummer);
        }

        if (parsed?.belopp && !isNaN(parsed.belopp)) {
          setBelopp(Number(parsed.belopp));
        }

        // Sätt betaldatum eller använd dagens datum som fallback
        if (parsed?.betaldatum && parsed.betaldatum.trim() !== "") {
          setTransaktionsdatum(parsed.betaldatum);
        } else {
          // Fallback: Använd dagens datum om inget betaldatum hittades
          const today = new Date().toISOString();
          setTransaktionsdatum(today);
          console.log("💡 Ingen betaldatum hittades, använder dagens datum:", today);
        }
      } catch (error) {
        console.error("❌ OpenAI leverantörsfaktura parsing error:", error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [recognizedText]);

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
        {fil ? `📎 ${fil.name}` : "Ladda upp leverantörsfaktura"}
      </label>

      {isLoading && (
        <div className="flex flex-col items-center justify-center mb-6 text-white">
          <div className="w-6 h-6 mb-2 border-4 rounded-full border-cyan-400 border-t-transparent animate-spin" />
          <span className="text-sm text-cyan-200">
            Läser leverantörsfaktura och fyller i fält automatiskt...
          </span>
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
  console.log("🖼️ Förbereder bild för client-side OCR...");

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

  console.log("🔍 Startar Tesseract OCR...");

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
            console.log(`📖 OCR progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      }
    );

    console.log("✅ OCR klar! Extraherad text:", text.substring(0, 100) + "...");
    return text;
  } catch (error) {
    console.error("❌ Tesseract OCR fel:", error);
    throw new Error("OCR misslyckades");
  }
}
