"use client";

import { useState, useEffect, useCallback } from "react";
import {
  extractDataFromOCRKundfaktura,
  extractDataFromOCR,
  extractDataFromOCRLevFakt,
} from "../actions/ocrActions";
import { uploadReceiptImage } from "../../_utils/blobUpload";
import { dateTillÅÅÅÅMMDD } from "../../_utils/datum";

interface UseOCRProcessingProps {
  bokförSomFaktura: boolean;
  levfaktMode: boolean;
  leverantör?: any;
  fakturanummer?: string | null;
  fakturadatum?: string | null;
  utlaggMode: boolean;
  setBelopp?: (value: number | null) => void;
  setFakturadatum?: (value: string | null) => void;
}

export function useOCRProcessing({
  bokförSomFaktura,
  levfaktMode,
  leverantör,
  fakturanummer,
  fakturadatum,
  utlaggMode,
  setBelopp,
  setFakturadatum,
}: UseOCRProcessingProps) {
  // ====================================================
  // OCR TEXT STATE
  // ====================================================
  const [ocrText, setOcrText] = useState<string>("");
  const [reprocessFile, setReprocessFile] = useState<(() => Promise<void>) | null>(null);

  // ====================================================
  // FILE PROCESSING STATE
  // ====================================================
  const [fil, setFil] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // ====================================================
  // AUTO-EXTRACTION EFFECTS
  // ====================================================

  // Kör kundfaktura-AI när OCR-text finns och fakturamoden är aktiv
  useEffect(() => {
    if (bokförSomFaktura && ocrText && setBelopp && setFakturadatum) {
      const runKundfakturaAI = async () => {
        try {
          const parsed = await extractDataFromOCRKundfaktura(ocrText);

          if (parsed?.fakturadatum) {
            setFakturadatum(parsed.fakturadatum);
          }
          if (parsed?.belopp && !isNaN(parsed.belopp)) {
            setBelopp(Number(parsed.belopp));
          }
        } catch (error) {
          console.error("❌ Fel vid AI-extraktion för kundfaktura (auto):", error);
        }
      };
      runKundfakturaAI();
    }
  }, [bokförSomFaktura, ocrText, setBelopp, setFakturadatum]);

  // ====================================================
  // OCR HANDLERS
  // ====================================================

  const handleOcrTextChange = useCallback((text: string) => {
    setOcrText(text);
  }, []);

  const handleReprocessTrigger = useCallback((reprocessFn: () => Promise<void>) => {
    setReprocessFile(() => reprocessFn);
  }, []);

  const handleCheckboxChange = useCallback(
    async (checked: boolean) => {
      if (checked && reprocessFile) {
        await reprocessFile();
      }
    },
    [reprocessFile]
  );

  // ====================================================
  // FILE UPLOAD HELPERS
  // ====================================================

  const uploadFileToBlob = useCallback(
    async (file: File): Promise<{ success: boolean; url?: string; error?: string }> => {
      setIsUploading(true);
      setUploadError(null);

      try {
        // Skapa beskrivning baserat på kontext
        let beskrivning = "";
        if (leverantör?.namn) {
          beskrivning = leverantör.namn;
        } else if (levfaktMode && fakturanummer) {
          beskrivning = `faktura-${fakturanummer}`;
        } else if (utlaggMode) {
          beskrivning = "utlagg";
        } else if (bokförSomFaktura) {
          beskrivning = "kundfaktura";
        } else {
          beskrivning = "kvitto";
        }

        // Använd fakturadatum om tillgängligt, annars dagens datum
        const datum = fakturadatum || dateTillÅÅÅÅMMDD(new Date());

        const blobResult = await uploadReceiptImage(file, {
          beskrivning,
          datum,
        });

        if (blobResult.success && blobResult.url) {
          return { success: true, url: blobResult.url };
        } else {
          const error = blobResult.error || "Okänt fel vid filuppladdning";
          setUploadError(error);
          return { success: false, error };
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Okänt fel vid filuppladdning";
        setUploadError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsUploading(false);
      }
    },
    [leverantör, levfaktMode, fakturanummer, utlaggMode, bokförSomFaktura, fakturadatum]
  );

  // ====================================================
  // OCR EXTRACTION METHODS
  // ====================================================

  const extractDataFromOCRKund = useCallback(async (text: string) => {
    try {
      return await extractDataFromOCRKundfaktura(text);
    } catch (error) {
      console.error("❌ Fel vid OCR-extraktion för kundfaktura:", error);
      throw error;
    }
  }, []);

  const extractDataFromOCRGeneral = useCallback(async (text: string) => {
    try {
      return await extractDataFromOCR(text);
    } catch (error) {
      console.error("❌ Fel vid allmän OCR-extraktion:", error);
      throw error;
    }
  }, []);

  const extractDataFromOCRLeverantorsfaktura = useCallback(async (text: string) => {
    try {
      return await extractDataFromOCRLevFakt(text);
    } catch (error) {
      console.error("❌ Fel vid OCR-extraktion för leverantörsfaktura:", error);
      throw error;
    }
  }, []);

  // ====================================================
  // FILE MANAGEMENT
  // ====================================================

  const setFile = useCallback((file: File | null) => {
    setFil(file);
    if (!file) {
      setOcrText("");
      setReprocessFile(null);
      setUploadError(null);
    }
  }, []);

  const setPdfUrlValue = useCallback((url: string | null) => {
    setPdfUrl(url);
  }, []);

  const clearOCRData = useCallback(() => {
    setOcrText("");
    setReprocessFile(null);
    setUploadError(null);
  }, []);

  // ====================================================
  // COMPUTED VALUES
  // ====================================================

  const hasFile = Boolean(fil);
  const hasOCRText = Boolean(ocrText);
  const canReprocess = Boolean(reprocessFile);

  // ====================================================
  // RETURN INTERFACE
  // ====================================================

  return {
    // OCR State
    ocrText,
    hasOCRText,
    canReprocess,

    // File State
    fil,
    pdfUrl,
    hasFile,
    isUploading,
    uploadError,

    // OCR Handlers
    handleOcrTextChange,
    handleReprocessTrigger,
    handleCheckboxChange,

    // File Management
    setFile,
    setPdfUrlValue,
    clearOCRData,

    // Upload Functionality
    uploadFileToBlob,

    // OCR Extraction Methods
    extractDataFromOCRKund,
    extractDataFromOCRGeneral,
    extractDataFromOCRLeverantorsfaktura,
  };
}
