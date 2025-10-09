/**
 * Hook för SIE-filuppladdning och parsing
 *
 * Hanterar:
 * - Filval via input och drag-drop
 * - Filvalidering
 * - SIE parsing (client-side)
 * - Kontoanalys
 * - Server-upload för kontokontroll
 */

"use client";

import { useState } from "react";
import { decodeSieFile } from "../utils/encoding";
import { parseSieContent } from "../utils/parser";
import { analyzeAccounts } from "../utils/validation";
import { uploadSieFile } from "../actions/actions";
import type { SieData, Analys } from "../types/types";

const isDev = process.env.NODE_ENV !== "production";
const debugSie = (...args: Parameters<typeof console.debug>) => {
  if (isDev) {
    console.debug(...args);
  }
};

// Validering
const validateFileSize = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 50 * 1024 * 1024; // 50MB max för SIE-filer
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Filen är för stor (${Math.round(file.size / 1024 / 1024)}MB). Max 50MB tillåtet.`,
    };
  }
  return { valid: true };
};

const isValidSieFile = (filename: string): boolean => {
  const lowerName = filename.toLowerCase();
  return lowerName.endsWith(".sie") || lowerName.endsWith(".se4") || lowerName.endsWith(".se");
};

// Extrahera använda konton från parsad SIE-data
const extractUsedAccounts = (sieData: SieData): string[] => {
  const anvandaKonton = new Set<string>();

  sieData.verifikationer.forEach((ver) => {
    ver.transaktioner.forEach((trans) => {
      anvandaKonton.add(trans.konto);
    });
  });

  sieData.balanser.ingående.forEach((b) => anvandaKonton.add(b.konto));
  sieData.balanser.utgående.forEach((b) => anvandaKonton.add(b.konto));
  sieData.resultat.forEach((r) => anvandaKonton.add(r.konto));

  return Array.from(anvandaKonton);
};

export function useSieFileUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sieData, setSieData] = useState<SieData | null>(null);
  const [saknadeKonton, setSaknadeKonton] = useState<string[]>([]);
  const [analys, setAnalys] = useState<Analys | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetData = () => {
    setSieData(null);
    setSaknadeKonton([]);
    setAnalys(null);
    setError(null);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      resetData();
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];

    if (file && isValidSieFile(file.name)) {
      setSelectedFile(file);
      setError(null);
      resetData();
    } else {
      setError("Vänligen välj en .sie, .se4 eller .se fil");
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);

    try {
      // Frontend validering
      const sizeValidation = validateFileSize(selectedFile);
      if (!sizeValidation.valid) {
        setError(sizeValidation.error || "Filen är för stor");
        return;
      }

      // Validera filtyp
      if (!isValidSieFile(selectedFile.name)) {
        setError("Endast SIE-filer (.sie, .se4, .se) stöds");
        return;
      }

      // Läs och parsa fil frontend
      const arrayBuffer = await selectedFile.arrayBuffer();
      const { content, encoding, formatTag, diagnostics } = decodeSieFile(arrayBuffer, {
        debug: isDev,
        encodings: ["iso-8859-1", "windows-1252", "utf-8", "cp850"],
      });

      if (isDev) {
        diagnostics.forEach(({ message, data }) => {
          if (data === undefined || data === null) {
            debugSie(`🔍 SIE decode (client): ${message}`);
            return;
          }

          if (typeof data === "string" && data.length > 200) {
            debugSie(`🔍 SIE decode (client): ${message}`, `${data.slice(0, 200)}…`);
          } else {
            debugSie(`🔍 SIE decode (client): ${message}`, data);
          }
        });

        debugSie("📦 SIE decoding summary (client)", {
          encoding,
          formatTag,
          length: content.length,
        });
      }

      // Parsa SIE-innehåll frontend
      const parsedSieData = parseSieContent(content);

      // Hitta använda konton
      const anvandaKonton = extractUsedAccounts(parsedSieData);
      const sieKonton = parsedSieData.konton.map((k) => k.nummer);

      // Analysera konton frontend
      const accountAnalysis = analyzeAccounts(sieKonton, anvandaKonton);

      // Nu skicka parsad data till server för kontokontroll
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("parsedData", JSON.stringify(parsedSieData));
      formData.append("anvandaKonton", JSON.stringify(anvandaKonton));

      const result = await uploadSieFile(formData);

      if (result.success) {
        setSieData(parsedSieData);
        setSaknadeKonton(result.saknade || []);
        setAnalys(result.analys || accountAnalysis);
      } else {
        setError(result.error || "Fel vid uppladdning av fil");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("Ett oväntat fel uppstod vid uppladdning");
    } finally {
      setLoading(false);
    }
  };

  return {
    selectedFile,
    sieData,
    saknadeKonton,
    analys,
    loading,
    error,
    handleFileSelect,
    handleDrop,
    handleDragOver,
    handleUpload,
    resetData,
    setSelectedFile,
    setSieData,
    setSaknadeKonton,
    setAnalys,
  };
}
