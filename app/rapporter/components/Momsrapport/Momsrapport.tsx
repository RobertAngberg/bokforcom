"use client";

import Dropdown from "../../../_components/Dropdown";
import Knapp from "../../../_components/Knapp";
import LoadingSpinner from "../../../_components/LoadingSpinner";
import Toast from "../../../_components/Toast";
import { useMomsrapport } from "../../hooks/useMomsrapport";
import { PERIOD_OPTIONS } from "../../utils/periodOptions";
import { formatSEK } from "../../../_utils/format";
import MomsWizard from "./MomsWizard";
import type { MomsrapportProps } from "../../types/types";

export default function Momsrapport({ transaktionsdata, foretagsprofil }: MomsrapportProps) {
  const {
    loading,
    år,
    setÅr,
    årLista,
    månad,
    setMånad,
    toast,
    setToast,
    isExportingPDF,
    isExportingCSV,
    exportXML,
    exportPDF,
    exportCSV,
    fullData,
    ärKorrekt,
    momsAttBetalaEllerFaTillbaka,
    ruta49,
    organisationsnummer,
    showWizard,
    setShowWizard,
    handleOpenWizard,
    status: periodStatus,
    // Wizard state
    currentStep,
    validationResult,
    isValidating,
    hideOkVerifikat,
    isBokforing,
    bokforingSuccess,
    momsAttBetala,
    bokforingsposter,
    setCurrentStep,
    setHideOkVerifikat,
    handleBokfor,
    handleStepComplete,
  } = useMomsrapport({ transaktionsdata, foretagsprofil });

  if (loading) {
    return <LoadingSpinner />;
  }

  const spawnaBlock = (titel: string, fält: string[]) => {
    const data = fullData.filter((rad) => fält.includes(rad.fält));

    return (
      <div className="w-full md:w-1/2 px-2">
        <h3 className="text-lg font-semibold text-white mb-3">{titel}</h3>

        {/* Custom table for better control */}
        <div className="overflow-hidden border border-slate-700 rounded-lg">
          <table className="w-full text-sm border-collapse table-fixed">
            <thead className="bg-slate-800">
              <tr>
                <th className="w-16 px-4 py-3 text-center text-left">Fält</th>
                <th className="px-4 py-3 text-left">Beskrivning</th>
                <th className="w-32 px-4 py-3 text-right">Belopp</th>
              </tr>
            </thead>
            <tbody>
              {data.map((rad, index) => {
                const ärRuta49 = rad.fält === "49";
                const klass = ärRuta49
                  ? !ärKorrekt
                    ? "text-orange-500 font-bold"
                    : momsAttBetalaEllerFaTillbaka > 0
                      ? "text-orange-500 font-bold"
                      : "text-green-600 font-bold"
                  : "";

                const rowColorClass = index % 2 === 0 ? "bg-gray-950" : "bg-gray-900";

                return (
                  <tr key={rad.fält} className={rowColorClass}>
                    <td className="px-4 py-3 text-center">{rad.fält}</td>
                    <td className="px-4 py-3 text-left break-words">{rad.beskrivning}</td>
                    <td className={`px-4 py-3 text-right ${klass}`}>{formatSEK(rad.belopp)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl text-white mt-4">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3 md:flex-row md:gap-4 md:w-auto">
            <div className="w-full md:w-32">
              <Dropdown
                value={år}
                onChange={(value) => setÅr(value)}
                options={årLista.map((year) => ({ value: year, label: year }))}
                className="w-full md:w-32"
              />
            </div>

            <div className="w-full md:w-auto">
              <Dropdown
                value={månad}
                onChange={setMånad}
                className="w-full md:w-auto md:min-w-[160px]"
                options={PERIOD_OPTIONS}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:gap-4">
            <Knapp
              text="Momsdeklaration"
              onClick={handleOpenWizard}
              className="w-full md:w-auto"
              disabled={periodStatus?.status === "stängd"}
            />

            <Knapp
              text={isExportingPDF ? "Exporterar..." : "Exportera PDF"}
              onClick={exportPDF}
              disabled={isExportingPDF}
              className={`w-full md:w-auto ${isExportingPDF ? "opacity-50" : ""}`}
            />

            <Knapp
              text={isExportingCSV ? "Exporterar..." : "Exportera CSV"}
              onClick={exportCSV}
              disabled={isExportingCSV}
              className={`w-full md:w-auto ${isExportingCSV ? "opacity-50" : ""}`}
            />
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Main Content */}
      <div id="momsrapport-print-area" className="space-y-6">
        {/* Validation Message */}
        {!ärKorrekt && (
          <div className="mb-4 rounded bg-orange-600 p-3 text-white">
            ⚠️ Avvikelse upptäckt: Ruta 49 ({ruta49.toLocaleString("sv-SE")}) stämmer inte överens
            med beräkningen ({momsAttBetalaEllerFaTillbaka.toLocaleString("sv-SE")})
          </div>
        )}

        {/* Content Blocks */}
        <div className="flex flex-col md:flex-row gap-6 mb-10">
          {spawnaBlock("A. Momspliktig försäljning eller uttag exkl. moms", [
            "05",
            "06",
            "07",
            "08",
          ])}
          {spawnaBlock("B. Utgående moms på försäljning", ["10", "11", "12"])}
        </div>

        <div className="flex flex-col md:flex-row gap-6 mb-10">
          {spawnaBlock("C. Inkomster med omvänd moms", ["20", "21", "22", "23", "24"])}
          {spawnaBlock("D. Utgående moms omvänd", ["30", "31", "32"])}
        </div>

        <div className="flex flex-col md:flex-row gap-6 mb-10">
          {spawnaBlock("H. Import", ["50"])}
          {spawnaBlock("I. Utgående moms import", ["60", "61", "62"])}
        </div>

        <div className="flex flex-col md:flex-row gap-6 mb-10">
          {spawnaBlock("E. Momsfri försäljning och export", [
            "35",
            "36",
            "37",
            "38",
            "39",
            "40",
            "41",
            "42",
          ])}
          <div className="w-full md:w-1/2 flex flex-col gap-6">
            <div className="px-2">
              <h3 className="text-lg font-semibold text-white mb-3">F. Ingående moms</h3>

              {/* Custom table for F section */}
              <div className="overflow-hidden border border-slate-700 rounded-lg">
                <table className="w-full text-sm border-collapse table-fixed">
                  <thead className="bg-slate-800">
                    <tr>
                      <th className="w-16 px-4 py-3 text-center">Fält</th>
                      <th className="px-4 py-3 text-left">Beskrivning</th>
                      <th className="w-32 px-4 py-3 text-right">Belopp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fullData
                      .filter((rad) => ["48"].includes(rad.fält))
                      .map((rad, index) => {
                        const rowColorClass = index % 2 === 0 ? "bg-gray-950" : "bg-gray-900";

                        return (
                          <tr key={rad.fält} className={rowColorClass}>
                            <td className="px-4 py-3 text-center">{rad.fält}</td>
                            <td className="px-4 py-3 text-left break-words">{rad.beskrivning}</td>
                            <td className="px-4 py-3 text-right">{formatSEK(rad.belopp)}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-2">
              <h3 className="text-lg font-semibold text-white mb-3">
                G. Moms att betala eller få tillbaka
              </h3>

              {/* Custom table for G section */}
              <div className="overflow-hidden border border-slate-700 rounded-lg">
                <table className="w-full text-sm border-collapse table-fixed">
                  <thead className="bg-slate-800">
                    <tr>
                      <th className="w-16 px-4 py-3 text-center">Fält</th>
                      <th className="px-4 py-3 text-left">Beskrivning</th>
                      <th className="w-32 px-4 py-3 text-right">Belopp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fullData
                      .filter((rad) => ["49"].includes(rad.fält))
                      .map((rad, index) => {
                        const ärRuta49 = rad.fält === "49";
                        const klass = ärRuta49
                          ? !ärKorrekt
                            ? "text-orange-500 font-bold"
                            : momsAttBetalaEllerFaTillbaka > 0
                              ? "text-orange-500 font-bold"
                              : "text-green-600 font-bold"
                          : "";

                        const rowColorClass = index % 2 === 0 ? "bg-gray-950" : "bg-gray-900";

                        return (
                          <tr key={rad.fält} className={rowColorClass}>
                            <td className="px-4 py-3 text-center">{rad.fält}</td>
                            <td className="px-4 py-3 text-left break-words">{rad.beskrivning}</td>
                            <td className={`px-4 py-3 text-right ${klass}`}>
                              {formatSEK(rad.belopp)}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Momsdeklaration Wizard */}
      <MomsWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        year={år}
        period={månad}
        momsData={fullData}
        organisationsnummer={organisationsnummer}
        onExportXML={exportXML}
        currentStep={currentStep}
        validationResult={validationResult}
        isValidating={isValidating}
        hideOkVerifikat={hideOkVerifikat}
        isBokforing={isBokforing}
        bokforingSuccess={bokforingSuccess}
        momsAttBetala={momsAttBetala}
        bokforingsposter={bokforingsposter}
        setCurrentStep={setCurrentStep}
        setHideOkVerifikat={setHideOkVerifikat}
        handleBokfor={handleBokfor}
        handleStepComplete={handleStepComplete}
      />
    </div>
  );
}
