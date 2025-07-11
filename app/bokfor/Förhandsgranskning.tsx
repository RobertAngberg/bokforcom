"use client";

import Image from "next/image";
import { useState, useRef } from "react";

interface ForhandsgranskningProps {
  fil?: File | null;
  pdfUrl?: string | null;
}

export default function Forhandsgranskning({ fil, pdfUrl }: ForhandsgranskningProps) {
  const [showModal, setShowModal] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const hasFile = fil || pdfUrl;

  return (
    <>
      <div className="relative flex flex-col items-center justify-center w-full h-auto border-2 border-dashed border-gray-700 bg-slate-900 rounded-xl p-4 md:w-4/5 md:ml-4 mb-4 md:mb-0 transition">
        {!hasFile && (
          <p className="text-gray-500 text-center">Ditt underlag kommer att visas här</p>
        )}

        {fil?.type.startsWith("image/") && (
          <div className="w-full overflow-auto rounded max-h-[600px]">
            <Image
              src={URL.createObjectURL(fil)}
              alt="Forhandsgranskning"
              width={800}
              height={600}
              className="object-contain max-w-full rounded"
            />
          </div>
        )}

        {pdfUrl && !fil?.type.startsWith("image/") && (
          <div className="w-full overflow-auto rounded max-h-[600px]">
            <iframe
              ref={iframeRef}
              src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
              className="w-full rounded border-none"
              style={{
                width: "100%",
                height: "600px",
              }}
              title="PDF Viewer"
            />
          </div>
        )}

        {hasFile && (
          <button
            onClick={() => setShowModal(true)}
            className="absolute top-2 right-2 px-4 py-2 text-sm font-medium text-white bg-cyan-700 hover:bg-cyan-800 rounded-md transition"
          >
            Visa större
          </button>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
          <div className="relative max-w-6xl w-full h-[90vh] overflow-auto bg-slate-900 rounded-xl p-4">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded font-bold"
            >
              Stäng
            </button>

            <div className="flex justify-center items-center">
              {fil?.type.startsWith("image/") && (
                <Image
                  src={URL.createObjectURL(fil)}
                  alt="Stor förhandsgranskning"
                  width={1200}
                  height={1000}
                  className="rounded max-w-full h-auto"
                />
              )}

              {pdfUrl && !fil?.type.startsWith("image/") && (
                <iframe
                  src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                  className="w-full h-[80vh] border-none rounded"
                  title="PDF Viewer Modal"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
