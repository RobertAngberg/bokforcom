"use client";

import { uploadPDF } from "./actions";
import { useState } from "react";

// Frontend validation - flyttat från actions.ts
const validateFileUpload = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024; // 10MB max för PDF-filer
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Filen är för stor (${Math.round(file.size / 1024 / 1024)}MB). Max 10MB tillåtet.`,
    };
  }

  if (file.type !== "application/pdf") {
    return { valid: false, error: "Endast PDF-filer är tillåtna" };
  }

  return { valid: true };
};

export default function PDFUpload() {
  const [result, setResult] = useState<any>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateFileUpload(file);
      if (!validation.valid) {
        setValidationError(validation.error || "Ogiltig fil");
        e.target.value = ""; // Rensa input
      } else {
        setValidationError(null);
      }
    }
  };

  const handleSubmit = async (formData: FormData) => {
    const file = formData.get("file") as File;

    // Dubbelkontroll av validering innan upload
    if (file) {
      const validation = validateFileUpload(file);
      if (!validation.valid) {
        setValidationError(validation.error || "Ogiltig fil");
        return;
      }
    }

    setValidationError(null);
    const result = await uploadPDF(formData);
    setResult(result);
  };

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow">
      <h3 className="text-white text-xl mb-4">Ladda upp PDF</h3>

      <form action={handleSubmit}>
        <input
          name="file"
          type="file"
          accept=".pdf"
          required
          onChange={handleFileChange}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 mb-4"
        />

        {validationError && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 text-red-400 rounded">
            ❌ {validationError}
          </div>
        )}

        <button
          type="submit"
          disabled={!!validationError}
          className={`px-4 py-2 rounded transition-colors ${
            validationError
              ? "bg-gray-600 text-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          📄 Ladda upp PDF
        </button>
      </form>

      {result?.success && (
        <div className="mt-6 p-4 bg-green-800 rounded">
          <h4 className="text-green-100 font-semibold mb-2">✅ Uppladdning lyckades!</h4>
          <a
            href={result.blob.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors"
          >
            👁️ Visa PDF
          </a>
        </div>
      )}

      {result?.error && (
        <div className="mt-4 p-4 bg-red-800 rounded">
          <p className="text-red-100">❌ {result.error}</p>
        </div>
      )}
    </div>
  );
}
