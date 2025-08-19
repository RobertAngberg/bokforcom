// app/_utils/blobUpload.ts
"use server";

import { put } from "@vercel/blob";
import { createHash } from "crypto";
import { getUserId } from "./authUtils";

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
};

// Huvudfunktion för blob-upload
export async function uploadBlob(file: File, options: UploadOptions = {}): Promise<UploadResult> {
  try {
    // 🔒 Session-validering
    const userId = await getUserId();

    // 🔍 Filvalidering
    const validation = validateFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // 🗜️ Komprimera fil om nödvändigt
    const processedFile = await processFile(file, options);

    // 📁 Skapa säker sökväg
    const folder = options.folder || "uploads";
    const safeFileName = sanitizeFileName(file.name);
    const path = `${folder}/${userId}/${safeFileName}`;

    // ⬆️ Ladda upp till Vercel Blob
    const blob = await put(path, processedFile, {
      access: "public",
      addRandomSuffix: true,
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

  // För bilder, komprimera
  if (file.type.startsWith("image/")) {
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

// 📐 Beräkna nya dimensioner (behåll aspect ratio)
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let { width, height } = { width: originalWidth, height: originalHeight };

  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }

  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }

  return { width: Math.round(width), height: Math.round(height) };
}

// 🧹 Rensa filnamn
function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .toLowerCase();
}

// 🎯 Convenience-funktioner för specifika användningsfall
export const uploadInvoiceAttachment = async (file: File) =>
  uploadBlob(file, { folder: "invoices", quality: 0.7 });

export const uploadReceiptImage = async (file: File) =>
  uploadBlob(file, { folder: "receipts", quality: 0.8, maxWidth: 1200 });

export const uploadProfileImage = async (file: File) =>
  uploadBlob(file, { folder: "profiles", quality: 0.9, maxWidth: 400, maxHeight: 400 });

// 🗜️ Exporterad komprimerings-funktion för direkt användning (utan upload)
export async function compressImageFile(file: File, options: UploadOptions = {}): Promise<File> {
  if (!file.type.startsWith("image/")) {
    return file; // Returnera oförändrad om inte bild
  }

  return await compressImage(file, options);
}
