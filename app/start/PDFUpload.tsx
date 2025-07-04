"use client";

import { uploadPDF } from "./actions";
import { useState } from "react";

export default function PDFUpload() {
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (formData: FormData) => {
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
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 mb-4"
        />

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
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
