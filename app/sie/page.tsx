//#region
"use client";

import { useState } from "react";
import MainLayout from "../_components/MainLayout";
import Knapp from "../_components/Knapp";
import TillbakaPil from "../_components/TillbakaPil";
import { useSieFileUpload } from "./hooks/useSieFileUpload";
import { useSieExport } from "./hooks/useSieExport";
import { usePagination } from "./hooks/usePagination";
import { useSieDataView } from "./hooks/useSieDataView";
import ImportWizard from "./components/ImportWizard";
import SieFileUploadSection from "./components/SieFileUploadSection";
import SieDataHeader from "./components/SieDataHeader";
import SieDataTabs from "./components/SieDataTabs";

export default function SiePage() {
  const {
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
    setSelectedFile,
    setSieData,
    setSaknadeKonton,
    setAnalys,
  } = useSieFileUpload();
  //#endregion

  // UI state
  const [visaSaknade, setVisaSaknade] = useState(false);
  const [visaWizard, setVisaWizard] = useState(false);

  // Export hook
  const { exportLoading, handleExport } = useSieExport();

  // Pagination hook
  const { currentPage, getPaginatedData, getTotalPages, goToPage, resetPage } = usePagination(20);

  // Data view hook
  const { activeTab, switchTab, resetView } = useSieDataView();

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
        {/* Tillbakapil uppe till vänster */}
        {sieData && (
          <div className="flex justify-start mb-6">
            <TillbakaPil
              onClick={() => {
                setSieData(null);
                setSelectedFile(null);
                setSaknadeKonton([]);
                setVisaSaknade(false);
                setAnalys(null);
                resetView();
                resetPage();
              }}
              className="relative left-auto top-auto"
            />
          </div>
        )}

        {/* Titel och beskrivning - endast när ingen SIE-data är uppladdad */}
        {!sieData && (
          <SieFileUploadSection
            selectedFile={selectedFile}
            loading={loading}
            error={error}
            handleFileSelect={handleFileSelect}
            handleDrop={handleDrop}
            handleDragOver={handleDragOver}
            handleUpload={handleUpload}
          />
        )}

        {/* SIE Data Visning */}
        {sieData && (
          <div className="bg-slate-800 rounded-lg p-6">
            {/* Header med företagsinfo */}
            <SieDataHeader
              sieData={sieData}
              analys={analys}
              saknadeKonton={saknadeKonton}
              visaSaknade={visaSaknade}
              setVisaSaknade={setVisaSaknade}
            />

            {/* Tabs med all data */}
            <SieDataTabs
              sieData={sieData}
              activeTab={activeTab}
              switchTab={switchTab}
              resetPage={resetPage}
              currentPage={currentPage}
              goToPage={goToPage}
              getPaginatedData={getPaginatedData as <T>(data: T[]) => T[]}
              getTotalPages={getTotalPages}
            />

            {/* Slutet av SIE-data visning */}
          </div>
        )}

        {/* Import-knapp längst ner - endast när SIE-data är uppladdad */}
        {sieData && (
          <div className="bg-green-500/20 border border-green-500 rounded-lg p-4 mt-8">
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
        )}

        {/* Export knapp längst ner - endast när ingen SIE-data är uppladdad */}
        {!sieData && (
          <div className="flex justify-end mt-8">
            <Knapp
              text={exportLoading ? "Exporterar..." : "📤 Exportera SIE-fil"}
              onClick={() => handleExport(2025)}
              disabled={exportLoading}
            />
          </div>
        )}
      </div>
    </MainLayout>
  );
}
