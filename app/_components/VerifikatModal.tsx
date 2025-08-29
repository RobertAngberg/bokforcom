"use client";

import { useEffect, useState } from "react";

// OBS...
import { fetchTransactionDetails } from "../rapporter/huvudbok/actions";

interface VerifikatModalProps {
  transaktionsId: number;
  onClose: () => void;
}

export default function VerifikatModal({ transaktionsId, onClose }: VerifikatModalProps) {
  const [details, setDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Säker URL-validering
  const isValidUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      // Tillåt endast säkra protokoll
      return ["https:", "http:", "data:"].includes(urlObj.protocol);
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (!transaktionsId) return;
    setLoading(true);
    fetchTransactionDetails(transaktionsId).then((data) => {
      setDetails(data);
      setLoading(false);
    });
  }, [transaktionsId]);

  if (!transaktionsId) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-600 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-600 bg-slate-900">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {details.length > 0 && details[0].verifikatNummer
                ? details[0].verifikatNummer
                : "Verifikat"}
            </h2>
            {details.length > 0 && (
              <div className="text-slate-300 text-sm mt-1 space-y-1">
                {details[0].transaktionsdatum && (
                  <div>
                    📅{" "}
                    {new Date(details[0].transaktionsdatum).toLocaleDateString("sv-SE", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                )}
                {details[0].verifikat_beskrivning && (
                  <div className="text-slate-400">{details[0].verifikat_beskrivning}</div>
                )}
              </div>
            )}
          </div>
          <button
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg"
            onClick={onClose}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-slate-300">Laddar verifikat...</span>
            </div>
          ) : (
            <>
              {/* Kontotabell */}
              <div className="mb-6">
                <div className="bg-slate-900 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-700">
                        <th className="text-left p-4 text-slate-200 font-medium">Konto</th>
                        <th className="text-right p-4 text-slate-200 font-medium">Debet</th>
                        <th className="text-right p-4 text-slate-200 font-medium">Kredit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {details.map((row, index) => (
                        <tr
                          key={row.transaktionspost_id || index}
                          className={`border-t border-slate-700 ${index % 2 === 0 ? "bg-slate-900" : "bg-slate-800"}`}
                        >
                          <td className="p-4 text-white">
                            <div className="font-medium">{row.kontonummer}</div>
                            <div className="text-slate-400 text-sm">{row.beskrivning}</div>
                          </td>
                          <td className="text-right p-4 text-white">
                            {row.debet !== undefined ? (
                              <span className="text-white">
                                {row.debet.toLocaleString("sv-SE", {
                                  style: "currency",
                                  currency: "SEK",
                                })}
                              </span>
                            ) : (
                              <span className="text-slate-500">–</span>
                            )}
                          </td>
                          <td className="text-right p-4 text-white">
                            {row.kredit !== undefined ? (
                              <span className="text-white">
                                {row.kredit.toLocaleString("sv-SE", {
                                  style: "currency",
                                  currency: "SEK",
                                })}
                              </span>
                            ) : (
                              <span className="text-slate-500">–</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Kommentar och bilagor */}
              {(details[0]?.kommentar || details[0]?.fil || details[0]?.blob_url) && (
                <div className="space-y-6">
                  {details[0]?.kommentar && (
                    <div className="bg-slate-900 rounded-xl p-4">
                      <h4 className="text-white font-medium mb-2 flex items-center">
                        <svg
                          className="w-5 h-5 mr-2 text-blue-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1l-4 4z"
                          />
                        </svg>
                        Kommentar
                      </h4>
                      <p className="text-slate-300">{details[0].kommentar}</p>
                    </div>
                  )}

                  {/* Visa bilaga från Vercel Blob */}
                  {details[0]?.blob_url && (
                    <div className="bg-slate-900 rounded-xl p-4">
                      <h4 className="text-white font-medium mb-3 flex items-center">
                        <svg
                          className="w-5 h-5 mr-2 text-green-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                          />
                        </svg>
                        Verifikatbilaga
                        {details[0]?.fil && (
                          <span className="ml-2 text-sm text-slate-400">({details[0].fil})</span>
                        )}
                      </h4>

                      {/* Förhandsvisning och länk baserat på filtyp */}
                      {details[0].blob_url.toLowerCase().includes(".pdf") ? (
                        // PDF - visa länk istället för iframe (Vercel Blob iframe-problem)
                        <div className="border border-slate-600 rounded-lg p-6 mb-3 bg-slate-800 text-center">
                          <div className="text-6xl mb-4">📄</div>
                          <div className="text-white mb-2">PDF-dokument</div>
                          <div className="text-slate-400 text-sm mb-4">
                            {details[0]?.fil || "PDF-bilaga"}
                          </div>
                          <a
                            href={details[0].blob_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                          >
                            <svg
                              className="w-4 h-4 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                            Öppna PDF
                          </a>
                        </div>
                      ) : (
                        // Bildvisning - visa förhandsvisning och länk
                        <div className="border border-slate-600 rounded-lg overflow-hidden bg-slate-800 mb-3">
                          <div className="relative">
                            <img
                              src={details[0].blob_url}
                              alt="Verifikatbilaga"
                              className="w-full h-auto max-h-96 object-contain cursor-pointer"
                              onClick={() => window.open(details[0].blob_url, '_blank')}
                              title="Klicka för att öppna i full storlek"
                            />
                            <div className="absolute top-2 right-2">
                              <a
                                href={details[0].blob_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-2 py-1 bg-black/70 hover:bg-black/90 text-white rounded text-xs transition-colors"
                              >
                                <svg
                                  className="w-3 h-3 mr-1"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                  />
                                </svg>
                                Öppna
                              </a>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Fallback för gamla filer som bara har fil-URL */}
                  {!details[0]?.blob_url && details[0]?.fil && isValidUrl(details[0].fil) && (
                    <div className="flex justify-center">
                      <a
                        href={details[0].fil}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                        Öppna fil
                      </a>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
