"use client";

import { useState, useEffect } from "react";
import extractTextFromPDF from "pdf-parser-client-side";
import { extractDataFromOCR } from "./actions";
import Tesseract from "tesseract.js";

interface FileUploadProps {
  setFil: (file: File | null) => void;
  setPdfUrl: (url: string) => void;
  setTransaktionsdatum: (datum: string) => void;
  setBelopp: (belopp: number) => void;
  fil: File | null;
}

export default function LaddaUppFil({
  setFil,
  setPdfUrl,
  setTransaktionsdatum,
  setBelopp,
  fil,
}: FileUploadProps) {
  const [recognizedText, setRecognizedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [timeoutTriggered, setTimeoutTriggered] = useState(false);

  // Mjukare bildkomprimering - mål 100-200KB (läsbar)
  async function komprimeraImage(file: File): Promise<File> {
    return new Promise((resolve) => {
      console.log(`🗜️ Komprimerar bild: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;

        // Mjukare storleksreduktion - behåll läsbarhet
        const maxDim = 1200; // Större dimensioner för läsbarhet
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width *= ratio;
          height *= ratio;
        }

        // Minsta storlek för läsbarhet
        const minDim = 400;
        if (width < minDim && height < minDim) {
          const ratio = minDim / Math.max(width, height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Börja med högre kvalitet för läsbarhet
        tryCompress(0.7);

        function tryCompress(quality: number) {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressed = new File(
                  [blob],
                  file.name.replace(/\.[^.]+$/, "_compressed.jpg"),
                  { type: "image/jpeg" }
                );

                const sizeKB = compressed.size / 1024;
                console.log(`📊 Kvalitet ${(quality * 100).toFixed(1)}%: ${sizeKB.toFixed(1)}KB`);

                // Mål: 100-200KB (läsbar men inte för stor)
                if (sizeKB <= 200 || quality <= 0.3) {
                  const savings = (((file.size - compressed.size) / file.size) * 100).toFixed(1);
                  console.log(
                    `✅ BILD FINAL: ${(file.size / 1024).toFixed(1)}KB → ${sizeKB.toFixed(1)}KB (${savings}% mindre)`
                  );
                  resolve(compressed);
                } else {
                  // Minska kvalitet gradvis
                  tryCompress(quality * 0.8);
                }
              } else {
                resolve(file);
              }
            },
            "image/jpeg",
            quality
          );
        }
      };

      img.onerror = () => {
        console.log("⚠️ Bildinladdning misslyckades, använder original");
        resolve(file);
      };

      img.src = URL.createObjectURL(file);
    });
  }

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
        alert(
          `PDF-filen är för stor (${sizeMB.toFixed(1)}MB).\nMaximal tillåten storlek är ${maxPdfMB}MB.`
        );
        // Rensa input
        event.target.value = "";
        return;
      }
    } else if (originalFile.type.startsWith("image/")) {
      const maxImageMB = 10; // 10MB gräns för bilder
      if (sizeMB > maxImageMB) {
        console.error(`❌ Bild för stor: ${sizeMB.toFixed(1)}MB (max ${maxImageMB}MB)`);
        alert(
          `Bilden är för stor (${sizeMB.toFixed(1)}MB).\nMaximal tillåten storlek är ${maxImageMB}MB.`
        );
        // Rensa input
        event.target.value = "";
        return;
      }
    }

    let file = originalFile;

    // Komprimera bilder mjukt - PDF behålls original
    if (originalFile.type.startsWith("image/")) {
      console.log("🖼️ Startar mjuk bildkomprimering...");
      file = await komprimeraImage(originalFile);
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

    const fileUrl = URL.createObjectURL(file);
    setPdfUrl(fileUrl);
    setFil(file);

    setIsLoading(true);
    setTimeoutTriggered(false);

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
          // Försök textextraktion först (snabbt för text-baserade PDF:er)
          text = (await extractTextFromPDF(file, "clean")) || "";
          console.log("✅ PDF textextraktion:", text ? `${text.length} tecken` : "ingen text");

          // Om ingen text hittades, acceptera att vi inte kan läsa skannade PDFs
          if (!text || text.trim().length === 0) {
            console.log("� PDF innehåller ingen markerbar text (troligen skannad)");
            console.log("⚠️ OCR på PDF-filer stöds inte för tillfället");
            text = "";
          }
        } catch (pdfError) {
          console.error("❌ PDF textextraktion misslyckades:", pdfError);
          console.log("� Kunde inte läsa PDF - accepterar att ingen text extraherats");
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
        const parsed = await extractDataFromOCR(recognizedText);
        console.log("📄 Parsed data:", parsed);

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
