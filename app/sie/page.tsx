"use client";

import { useState } from "react";
import MainLayout from "../_components/MainLayout";
import Knapp from "../_components/Knapp";
import { uploadSieFile, exporteraSieData } from "./actions";
import ImportWizard from "./ImportWizard";

interface SieData {
  header: {
    program: string;
    organisationsnummer: string;
    företagsnamn: string;
    räkenskapsår: Array<{ år: number; startdatum: string; slutdatum: string }>;
    kontoplan: string;
  };
  konton: Array<{
    nummer: string;
    namn: string;
  }>;
  verifikationer: Array<{
    serie: string;
    nummer: string;
    datum: string;
    beskrivning: string;
    transaktioner: Array<{
      konto: string;
      belopp: number;
    }>;
  }>;
  balanser: {
    ingående: Array<{ konto: string; belopp: number }>;
    utgående: Array<{ konto: string; belopp: number }>;
  };
  resultat: Array<{ konto: string; belopp: number }>;
}

export default function SiePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sieData, setSieData] = useState<SieData | null>(null);
  const [saknadeKonton, setSaknadeKonton] = useState<string[]>([]);
  const [visaSaknade, setVisaSaknade] = useState(false);
  const [visaWizard, setVisaWizard] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [analys, setAnalys] = useState<{
    totaltAntal: number;
    standardKonton: number;
    specialKonton: number;
    kritiskaKonton: string[];
    anvandaSaknade: number;
    totaltAnvanda: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "översikt" | "konton" | "verifikationer" | "balanser" | "resultat"
  >("översikt");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setSieData(null);
      setSaknadeKonton([]);
      setVisaSaknade(false);
      setAnalys(null);
      setCurrentPage(1);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (
      file &&
      (file.name.endsWith(".sie") || file.name.endsWith(".se4") || file.name.endsWith(".se"))
    ) {
      setSelectedFile(file);
      setError(null);
      setSieData(null);
      setSaknadeKonton([]);
      setVisaSaknade(false);
      setAnalys(null);
      setCurrentPage(1);
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
      const formData = new FormData();
      formData.append("file", selectedFile);

      const result = await uploadSieFile(formData);

      if (result.success && result.data) {
        setSieData(result.data);
        setSaknadeKonton(result.saknade || []);
        setAnalys(result.analys || null);
        setCurrentPage(1);

        // Fil uppladdad framgångsrikt - visa översikt
      } else {
        setError(result.error || "Fel vid uppladdning av fil");
      }
    } catch (err) {
      setError("Ett oväntat fel uppstod vid uppladdning");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    setError(null);

    try {
      const result = await exporteraSieData(2025);

      if (result.success && result.data) {
        // Skapa blob och ladda ner fil
        const blob = new Blob([result.data], { type: "text/plain;charset=utf-8" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `export_${new Date().toISOString().slice(0, 10)}.se4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        setError(result.error || "Kunde inte exportera SIE-data");
      }
    } catch (err) {
      setError("Fel vid export av SIE-data");
    } finally {
      setExportLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency: "SEK",
    }).format(amount);
  };

  // Pagination helpers
  const getPaginatedData = (data: any[], page: number) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (totalItems: number) => {
    return Math.ceil(totalItems / itemsPerPage);
  };

  const PaginationControls = ({
    totalItems,
    currentPage,
    onPageChange,
  }: {
    totalItems: number;
    currentPage: number;
    onPageChange: (page: number) => void;
  }) => {
    const totalPages = getTotalPages(totalItems);

    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center items-center space-x-2 mt-6">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3 py-2 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:text-gray-500 text-white rounded"
        >
          ← Föregående
        </button>

        <span className="text-white px-4">
          Sida {currentPage} av {totalPages} ({totalItems} objekt)
        </span>

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-2 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:text-gray-500 text-white rounded"
        >
          Nästa →
        </button>
      </div>
    );
  };

  // Visa wizard om användaren väljer det
  if (visaWizard && sieData && analys) {
    return (
      <ImportWizard
        sieData={sieData}
        saknadeKonton={saknadeKonton}
        analys={analys}
        selectedFile={selectedFile}
        onCancel={() => setVisaWizard(false)}
      />
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">SIE Import</h1>
          <p className="text-gray-300">Ladda upp SIE-filer för att visa bokföringsdata</p>

          {/* Export knapp */}
          <div className="mt-6">
            <Knapp
              text={exportLoading ? "Exporterar..." : "📤 Exportera SIE-fil"}
              onClick={handleExport}
              disabled={exportLoading}
            />
          </div>
        </div>

        {/* Filuppladdning */}
        {!sieData && (
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
                <div className="mt-6">
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
        )}

        {/* SIE Data Visning */}
        {sieData && (
          <div className="bg-slate-800 rounded-lg p-6">
            {/* Header med företagsinfo */}
            <div className="mb-6 bg-slate-700 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Företagsinformation</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white">
                <div>
                  <strong>Program:</strong> {sieData.header.program}
                </div>
                <div>
                  <strong>Organisationsnummer:</strong> {sieData.header.organisationsnummer}
                </div>
                <div>
                  <strong>Företagsnamn:</strong> {sieData.header.företagsnamn}
                </div>
                <div>
                  <strong>Kontoplan:</strong> {sieData.header.kontoplan}
                </div>
              </div>

              {/* Varning för saknade konton */}
              {analys && (analys.specialKonton > 0 || analys.kritiskaKonton.length > 0) && (
                <div className="mt-4 space-y-2">
                  {/* Info om kontoanalys */}
                  <div className="bg-blue-500/20 border border-blue-500 text-blue-400 px-4 py-3 rounded">
                    <div className="flex items-center justify-between">
                      <div>
                        <strong>ℹ️ Kontoanalys:</strong> SIE-filen innehåller {analys.totaltAntal}{" "}
                        konton från hela BAS-kontoplanen.{" "}
                        {saknadeKonton.length > 0
                          ? `${saknadeKonton.length} specialkonto behöver granskas.`
                          : "Alla använda konton finns redan i din kontoplan."}
                      </div>
                      {saknadeKonton.length > 0 && (
                        <button
                          onClick={() => setVisaSaknade(!visaSaknade)}
                          className="ml-4 underline hover:no-underline text-sm"
                        >
                          {visaSaknade ? "Dölj specialkonton" : "Visa specialkonton"} →
                        </button>
                      )}
                    </div>

                    {/* Expanderbar lista med saknade konton */}
                    {visaSaknade && saknadeKonton.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-blue-400/30">
                        <h4 className="font-semibold text-blue-300 mb-3">
                          Specialkonton som saknas ({saknadeKonton.length} st)
                        </h4>
                        <p className="text-blue-300 text-sm mb-3">
                          Dessa konton är inte BAS-standardkonton och bör granskas:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                          {saknadeKonton.map((kontonummer) => {
                            const kontoInfo = sieData?.konton.find((k) => k.nummer === kontonummer);
                            return (
                              <div key={kontonummer} className="bg-blue-900/30 rounded-lg p-2">
                                <div className="text-sm font-bold text-blue-200">{kontonummer}</div>
                                {kontoInfo && (
                                  <div className="text-blue-300 text-xs mt-1">{kontoInfo.namn}</div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Kritiska konton varning - behåll denna */}
                  {analys.kritiskaKonton.length > 0 && (
                    <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded">
                      <strong>🚨 Kritisk:</strong> {analys.kritiskaKonton.length} kritiska
                      företagsspecifika konton saknas som behöver skapas för korrekt import.
                    </div>
                  )}

                  {/* Info om standardkonton */}
                  {analys.standardKonton > 0 && (
                    <div className="bg-blue-500/20 border border-blue-500 text-blue-400 px-4 py-3 rounded text-sm">
                      <strong>ℹ️ Info:</strong> {analys.standardKonton} BAS-standardkonton hittades
                      som inte finns i din kontoplan (detta är normalt).
                    </div>
                  )}

                  {/* Import-knapp */}
                  <div className="bg-green-500/20 border border-green-500 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-green-400 mb-1">Redo att importera?</h3>
                        <p className="text-green-300 text-sm">
                          Starta import-wizarden för att säkert importera data till din databas.
                        </p>
                      </div>
                      <Knapp text="Starta Import-wizard →" onClick={() => setVisaWizard(true)} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Flikar */}
            <div className="mb-6">
              <div className="flex space-x-1 bg-slate-700 p-1 rounded-lg">
                {["översikt", "konton", "verifikationer", "balanser", "resultat"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab as any);
                      setCurrentPage(1);
                    }}
                    className={`px-4 py-2 rounded-md capitalize transition-colors ${
                      activeTab === tab
                        ? "bg-cyan-600 text-white"
                        : "text-gray-300 hover:text-white hover:bg-slate-600"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab innehåll */}
            {activeTab === "översikt" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-700 rounded-lg p-6 text-center">
                    <h3 className="text-lg font-semibold text-white mb-2">Antal Konton</h3>
                    <p className="text-3xl font-bold text-cyan-400">{sieData.konton.length}</p>
                  </div>
                  <div className="bg-slate-700 rounded-lg p-6 text-center">
                    <h3 className="text-lg font-semibold text-white mb-2">Antal Verifikationer</h3>
                    <p className="text-3xl font-bold text-cyan-400">
                      {sieData.verifikationer.length}
                    </p>
                  </div>
                  <div className="bg-slate-700 rounded-lg p-6 text-center">
                    <h3 className="text-lg font-semibold text-white mb-2">Räkenskapsår</h3>
                    <p className="text-lg text-white">
                      {sieData.header.räkenskapsår.length > 0 &&
                        `${sieData.header.räkenskapsår[0].startdatum} - ${sieData.header.räkenskapsår[0].slutdatum}`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "konton" && (
              <div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-white">
                    <thead>
                      <tr className="border-b border-slate-600">
                        <th className="text-left py-3 px-4">Kontonummer</th>
                        <th className="text-left py-3 px-4">Kontonamn</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getPaginatedData(sieData.konton, currentPage).map((konto, index) => (
                        <tr key={index} className="border-b border-slate-700 hover:bg-slate-700">
                          <td className="py-3 px-4">{konto.nummer}</td>
                          <td className="py-3 px-4">{konto.namn}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <PaginationControls
                  totalItems={sieData.konton.length}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}

            {activeTab === "verifikationer" && (
              <div>
                <div className="space-y-4">
                  {getPaginatedData(sieData.verifikationer, currentPage).map((ver, index) => (
                    <div key={index} className="bg-slate-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-white font-semibold">
                            {ver.serie} {ver.nummer}
                          </h4>
                          <p className="text-gray-300">{ver.beskrivning}</p>
                        </div>
                        <div className="text-gray-300">{ver.datum}</div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-600">
                              <th className="text-left py-2 text-gray-300">Konto</th>
                              <th className="text-right py-2 text-gray-300">Belopp</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ver.transaktioner.map(
                              (trans: { konto: string; belopp: number }, i: number) => (
                                <tr key={i} className="text-white">
                                  <td className="py-1">{trans.konto}</td>
                                  <td className="py-1 text-right">
                                    {formatCurrency(trans.belopp)}
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
                <PaginationControls
                  totalItems={sieData.verifikationer.length}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}

            {activeTab === "balanser" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">Ingående Balanser</h3>
                  <div className="overflow-x-auto max-h-96">
                    <table className="min-w-full text-white text-sm">
                      <thead>
                        <tr className="border-b border-slate-600">
                          <th className="text-left py-2">Konto</th>
                          <th className="text-right py-2">Belopp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sieData.balanser.ingående.map((balans, index) => (
                          <tr key={index} className="border-b border-slate-700">
                            <td className="py-2">{balans.konto}</td>
                            <td className="py-2 text-right">{formatCurrency(balans.belopp)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">Utgående Balanser</h3>
                  <div className="overflow-x-auto max-h-96">
                    <table className="min-w-full text-white text-sm">
                      <thead>
                        <tr className="border-b border-slate-600">
                          <th className="text-left py-2">Konto</th>
                          <th className="text-right py-2">Belopp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sieData.balanser.utgående.map((balans, index) => (
                          <tr key={index} className="border-b border-slate-700">
                            <td className="py-2">{balans.konto}</td>
                            <td className="py-2 text-right">{formatCurrency(balans.belopp)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "resultat" && (
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Resultaträkning</h3>
                <div className="overflow-x-auto max-h-96">
                  <table className="min-w-full text-white text-sm">
                    <thead>
                      <tr className="border-b border-slate-600">
                        <th className="text-left py-2">Konto</th>
                        <th className="text-right py-2">Belopp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sieData.resultat.map((resultat, index) => (
                        <tr key={index} className="border-b border-slate-700">
                          <td className="py-2">{resultat.konto}</td>
                          <td className="py-2 text-right">{formatCurrency(resultat.belopp)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Återställ knapp */}
            <div className="mt-8 text-center">
              <Knapp
                text="Ladda upp ny fil"
                onClick={() => {
                  setSieData(null);
                  setSelectedFile(null);
                  setSaknadeKonton([]);
                  setVisaSaknade(false);
                  setAnalys(null);
                  setActiveTab("översikt");
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
