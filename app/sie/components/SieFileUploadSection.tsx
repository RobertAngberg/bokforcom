"use client";

import Knapp from "../../_components/Knapp";

interface SieFileUploadSectionProps {
  selectedFile: File | null;
  loading: boolean;
  error: string | null;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  handleUpload: () => void;
}

export default function SieFileUploadSection({
  selectedFile,
  loading,
  error,
  handleFileSelect,
  handleDrop,
  handleDragOver,
  handleUpload,
}: SieFileUploadSectionProps) {
  return (
    <>
      {/* Titel och beskrivning */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-4">SIE Import</h1>
        <p className="text-gray-300">Ladda upp SIE-filer för att visa bokföringsdata</p>
      </div>

      {/* Filuppladdning */}
      <div className="bg-slate-800 rounded-lg p-8 mb-6">
        <div
          className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-cyan-500 transition-colors"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <div className="text-6xl text-slate-600 mb-4">📁</div>
          <p className="text-xl text-white mb-4">
            Dra och släpp SIE-fil här eller klicka för att välja
          </p>
          <input
            type="file"
            accept=".sie,.se4,.se"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="inline-block bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg cursor-pointer transition-colors"
          >
            Välj fil
          </label>

          {selectedFile && (
            <div className="mt-6 flex flex-col items-center">
              <p className="text-white mb-4">
                Vald fil: <strong>{selectedFile.name}</strong>
              </p>
              <Knapp
                text={loading ? "Laddar..." : "Ladda upp och analysera"}
                onClick={handleUpload}
                disabled={loading}
              />
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded mt-4">
            {error}
          </div>
        )}
      </div>
    </>
  );
}
