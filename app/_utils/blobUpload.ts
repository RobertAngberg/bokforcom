"use server";

import { put } from "@vercel/blob";
import { ensureSession } from "./session";

// Tillåtna filtyper och deras MIME-types
const ALLOWED_FILE_TYPES = {
  "image/jpeg": { ext: "jpg", maxSize: 1024 * 1024 }, // 1MB
  "image/png": { ext: "png", maxSize: 1024 * 1024 }, // 1MB
  "application/pdf": { ext: "pdf", maxSize: 1024 * 1024 }, // 1MB
} as const;

export type UploadResult = {
  success: boolean;
  url?: string;
  error?: string;
  originalSize?: number;
  compressedSize?: number;
};

export type UploadOptions = {
  folder?: string; // t.ex. "invoices", "receipts", "profiles"
  quality?: number; // 0.1-1.0 för bildkompression
  maxWidth?: number; // Max bredd för bilder
  maxHeight?: number; // Max höjd för bilder
  beskrivning?: string; // Beskrivning som läggs till i filnamnet
  datum?: string; // Datum i format YYYY-MM-DD
};

// Huvudfunktion för blob-upload
export async function uploadBlob(file: File, options: UploadOptions = {}): Promise<UploadResult> {
  try {
    // 🔒 Session-validering
    const { userId } = await ensureSession();

    // 🔍 Filvalidering
    const validation = validateFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // 🗜️ Komprimera fil om nödvändigt
    const processedFile = await processFile(file, options);

    // 📁 Skapa säker sökväg med userId som rotmapp
    const smartFileName = createSmartFileName(file.name, options);
    const path = `${userId}/${smartFileName}`;

    // ⬆️ Ladda upp till Vercel Blob (utan addRandomSuffix eftersom vi har egen logik)
    const blob = await put(path, processedFile, {
      access: "public",
      addRandomSuffix: false, // Vi hanterar naming själva
    });

    return {
      success: true,
      url: blob.url,
      originalSize: file.size,
      compressedSize: processedFile.size,
    };
  } catch (error) {
    console.error("Blob upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload fel",
    };
  }
}

// 🔍 Filvalidering
function validateFile(file: File): { valid: boolean; error?: string } {
  const fileType = ALLOWED_FILE_TYPES[file.type as keyof typeof ALLOWED_FILE_TYPES];

  if (!fileType) {
    return {
      valid: false,
      error: `Filtyp ${file.type} stöds inte. Tillåtna: JPG, PNG, PDF`,
    };
  }

  if (file.size > fileType.maxSize) {
    const maxMB = Math.round(fileType.maxSize / 1024 / 1024);
    const fileMB = Math.round((file.size / 1024 / 1024) * 100) / 100;
    return {
      valid: false,
      error: `Filen är för stor (${fileMB}MB). Max ${maxMB}MB tillåtet.`,
    };
  }

  return { valid: true };
}

// 🗜️ Fil-processering och kompression
async function processFile(file: File, options: UploadOptions): Promise<File> {
  // För PDF-filer, returnera som de är
  if (file.type === "application/pdf") {
    return file;
  }

  // För bilder, komprimera endast om vi är på client-side
  if (file.type.startsWith("image/")) {
    // Kontrollera om vi är på server (document är undefined)
    if (typeof document === "undefined") {
      // På servern - returnera filen som den är utan kompression
      console.log("Server-side upload: Skipping image compression");
      return file;
    }
    // På client-side - komprimera bilden
    return await compressImage(file, options);
  }

  return file;
}

// 🖼️ Bildkompression med adaptiv kvalitet (förbättrad från lokala versioner)
async function compressImage(file: File, options: UploadOptions): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const img = new Image();

    img.onload = () => {
      // Beräkna nya dimensioner med mjukare storleksreduktion för läsbarhet
      let { width, height } = img;

      const maxDim = options.maxWidth || 1200; // Större för läsbarhet
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

      // Adaptiv kvalitetskompression - börja med högre kvalitet
      tryCompress(options.quality || 0.7);

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

              // Mål: 100-200KB (läsbar men inte för stor)
              if (sizeKB <= 200 || quality <= 0.3) {
                resolve(compressed);
              } else {
                // Minska kvalitet gradvis
                tryCompress(quality * 0.8);
              }
            } else {
              resolve(file); // Fallback
            }
          },
          "image/jpeg",
          quality
        );
      }
    };

    img.onerror = () => {
      resolve(file); // Fallback vid fel
    };

    img.src = URL.createObjectURL(file);
  });
}

// Skapa smart filnamn med datum och beskrivning
function createSmartFileName(originalName: string, options: UploadOptions): string {
  const fileExt = originalName.split(".").pop()?.toLowerCase() || "";
  const datum = options.datum || new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  let filename = datum; // Börja med datum

  if (options.beskrivning) {
    const safeBeskrivning = options.beskrivning
      .replace(/[^a-zA-Z0-9åäöÅÄÖ\s]/g, "") // Ta bort specialtecken
      .replace(/\s+/g, "-") // Ersätt mellanslag med bindestreck
      .toLowerCase();
    filename += `_${safeBeskrivning}`;
  }

  // Lägg till kort random suffix för att undvika kollisioner
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  filename += `_${randomSuffix}`;

  return `${filename}.${fileExt}`;
}

// 🎯 Convenience-funktioner för specifika användningsfall
export const uploadInvoiceAttachment = async (file: File) => uploadBlob(file, { quality: 0.7 });

export const uploadReceiptImage = async (file: File, options: UploadOptions = {}) =>
  uploadBlob(file, { quality: 0.8, maxWidth: 1200, ...options });

export const uploadProfileImage = async (file: File) =>
  uploadBlob(file, { quality: 0.9, maxWidth: 400, maxHeight: 400 });

export const uploadCompanyLogo = async (file: File) =>
  uploadBlob(file, {
    quality: 0.9,
    maxWidth: 800,
    maxHeight: 400,
    beskrivning: "foretags-logotyp",
  });

// 🗜️ Exporterad komprimerings-funktion för direkt användning (utan upload)
export async function compressImageFile(file: File, options: UploadOptions = {}): Promise<File> {
  if (!file.type.startsWith("image/")) {
    return file; // Returnera oförändrad om inte bild
  }

  return await compressImage(file, options);
}
