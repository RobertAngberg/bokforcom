"use client";

import Dropdown from "../../../_components/Dropdown";
import Knapp from "../../../_components/Knapp";
import { useMomsrapport } from "../../hooks/useMomsrapport";
import { useSession } from "../../../_lib/auth-client";

export default function Momsrapport() {
  const { data: sessionData, isPending } = useSession();

  // Använd hook för all state management
  const {
    loading,
    error,
    år,
    setÅr,
    årLista,
    exportMessage,
    isExportingPDF,
    isExportingCSV,
    isExportingXML,
    exportXML,
    exportPDF,
    exportCSV,
    fullData,
    ärKorrekt,
    momsAttBetalaEllerFaTillbaka,
    ruta49,
  } = useMomsrapport();

  // Session loading
  if (isPending) {
    return (
      <div className="mx-auto max-w-7xl px-4 text-white">
        <h1 className="mb-6 text-3xl text-center">Momsrapport</h1>
        <div className="flex h-40 items-center justify-center">
          <p>Verifierar session...</p>
        </div>
      </div>
    );
  }

  // Session check
  if (!sessionData?.user) {
    return (
      <div className="mx-auto max-w-7xl px-4 text-white">
        <h1 className="mb-6 text-3xl text-center">Momsrapport</h1>
        <div className="flex h-40 items-center justify-center">
          <p>Du måste vara inloggad för att se denna sida</p>
        </div>
      </div>
    );
  }

  // Error handling
  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 text-white">
        <h1 className="mb-6 text-3xl text-center">Momsrapport</h1>
        <div className="flex h-40 items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 mb-2">Fel vid laddning av data</p>
            <p className="text-sm text-gray-300">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Data loading
  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 text-white">
        <h1 className="mb-6 text-3xl text-center">Momsrapport</h1>
        <div className="flex h-40 items-center justify-center">
          <p>Laddar momsrapport...</p>
        </div>
      </div>
    );
  }

  // Block generator helper function
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
                    <td className={`px-4 py-3 text-right ${klass}`}>
                      {new Intl.NumberFormat("sv-SE", {
                        style: "currency",
                        currency: "SEK",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(rad.belopp)}
                    </td>
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
    <div className="mx-auto max-w-7xl px-4 text-white">
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-3xl text-center mb-4">Momsrapport</h1>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Dropdown
              value={år}
              onChange={(value) => setÅr(value)}
              options={årLista.map((year) => ({ value: year, label: year }))}
              className="w-24"
            />
          </div>

          <div className="flex items-center gap-3">
            <Knapp
              text={isExportingXML ? "Exporterar..." : "Exportera XML"}
              onClick={exportXML}
              disabled={isExportingXML}
            />

            <Knapp
              text={isExportingPDF ? "Exporterar..." : "Exportera PDF"}
              onClick={exportPDF}
              disabled={isExportingPDF}
            />

            <Knapp
              text={isExportingCSV ? "Exporterar..." : "Exportera CSV"}
              onClick={exportCSV}
              disabled={isExportingCSV}
            />
          </div>
        </div>
      </div>

      {/* Export Message */}
      {exportMessage && (
        <div className="mb-4 rounded bg-blue-600 p-3 text-white">{exportMessage}</div>
      )}

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
                            <td className="px-4 py-3 text-right">
                              {new Intl.NumberFormat("sv-SE", {
                                style: "currency",
                                currency: "SEK",
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              }).format(rad.belopp)}
                            </td>
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
                              {new Intl.NumberFormat("sv-SE", {
                                style: "currency",
                                currency: "SEK",
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              }).format(rad.belopp)}
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
    </div>
  );
}
