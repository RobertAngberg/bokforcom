"use client";

import Image from "next/image";
import { useState, useRef, useMemo, useEffect } from "react";
import { ForhandsgranskningProps } from "./_types/types";

export default function Forhandsgranskning({ fil, pdfUrl }: ForhandsgranskningProps) {
  const [showModal, setShowModal] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Memoize blob URL för att förhindra nya URLs varje render
  const blobUrl = useMemo(() => {
    return fil ? URL.createObjectURL(fil) : null;
  }, [fil]);

  // Cleanup blob URL när komponenten unmountar eller fil ändras
  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  const hasFile = fil || pdfUrl;

  return (
    <>
      <div className="relative flex flex-col items-center justify-center w-full h-auto border-2 border-dashed border-gray-700 bg-slate-900 rounded-xl p-4 md:w-4/5 md:ml-4 mb-4 md:mb-0 transition">
        {!hasFile && (
          <p className="text-gray-500 text-center">Ditt underlag kommer att visas här</p>
        )}

        {/* Visa bilder med Image komponenten */}
        {fil?.type.startsWith("image/") && (
          <div className="w-full overflow-auto rounded max-h-[600px]">
            <Image
              src={pdfUrl || blobUrl!}
              alt="Forhandsgranskning"
              width={800}
              height={600}
              className="object-contain max-w-full rounded"
            />
          </div>
        )}

        {/* Visa PDFs direkt inline */}
        {fil?.type === "application/pdf" && (
          <div className="w-full">
            <object
              data={blobUrl + "#toolbar=0&navpanes=0&scrollbar=0"}
              type="application/pdf"
              width="100%"
              height="600px"
              className="w-full rounded"
            >
              <div className="p-4 text-center bg-gray-50 rounded border">
                <p className="mb-2">PDF kan inte visas inline i denna webbläsare</p>
                <button
                  onClick={() => {
                    if (blobUrl) window.open(blobUrl, "_blank");
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Öppna PDF i ny flik
                </button>
              </div>
            </object>
          </div>
        )}

        {/* Visa länk för andra filtyper */}
        {pdfUrl && !fil?.type.startsWith("image/") && fil?.type !== "application/pdf" && (
          <div className="p-4 border border-gray-300 rounded bg-gray-50">
            <p className="mb-2">Fil uppladdad!</p>
            <a href={pdfUrl} target="_blank" className="text-blue-600 underline">
              Öppna fil
            </a>
          </div>
        )}

        {hasFile && (
          <button
            onClick={() => {
              if (fil?.type === "application/pdf") {
                // För PDFs, öppna i ny flik
                if (blobUrl) window.open(blobUrl, "_blank");
              } else if (fil?.type.startsWith("image/")) {
                // För bilder, visa modal som vanligt
                setShowModal(true);
              } else if (pdfUrl) {
                // För andra filer, öppna uploaded URL
                window.open(pdfUrl, "_blank");
              }
            }}
            className="absolute top-2 right-2 px-4 py-2 text-sm font-medium text-white bg-cyan-700 hover:bg-cyan-800 rounded-md transition"
          >
            {fil?.type === "application/pdf" || (!fil?.type.startsWith("image/") && pdfUrl)
              ? "Öppna i ny flik"
              : "Visa större"}
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
                  src={pdfUrl || blobUrl!}
                  alt="Stor förhandsgranskning"
                  width={1200}
                  height={1000}
                  className="rounded max-w-full h-auto"
                />
              )}

              {((pdfUrl && !fil?.type.startsWith("image/")) || fil?.type === "application/pdf") && (
                <iframe
                  src={`${pdfUrl || blobUrl!}#toolbar=0&navpanes=0&scrollbar=0`}
                  className="w-full h-[80vh] rounded"
                  title="PDF förhandsgranskning stor"
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
