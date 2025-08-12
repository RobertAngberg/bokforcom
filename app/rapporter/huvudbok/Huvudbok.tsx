// #region Imports och types
"use client";

import React from "react";
import MainLayout from "../../_components/MainLayout";
import AnimeradFlik from "../../_components/AnimeradFlik";
import Knapp from "../../_components/Knapp";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type HuvudboksKonto = {
  kontonummer: string;
  beskrivning: string;
  ingaendeBalans: number;
  utgaendeBalans: number;
};

type Props = {
  huvudboksdata: HuvudboksKonto[];
  företagsnamn?: string;
  organisationsnummer?: string;
};
// #endregion

export default function Huvudbok({ huvudboksdata, företagsnamn, organisationsnummer }: Props) {
  //#region Helper Functions
  // Formatering för SEK med behållet minustecken
  const formatSEK = (val: number) => {
    if (val === 0) return "0,00kr";

    const absVal = Math.abs(val);
    const isNegative = val < 0;
    const formatted = absVal.toFixed(2).replace(".", ",") + "kr";
    return isNegative ? `−${formatted}` : formatted;
  };

  // PDF-biblioteket hanterar inte Unicode-tecken korrekt - använd enkel ASCII-formatering
  const formatSEKforPDF = (val: number) => {
    if (val === 0) return "0kr";
    const isNegative = val < 0;
    const absVal = Math.abs(val);
    const rounded = Math.round(absVal);
    const formatted = rounded.toLocaleString('sv-SE') + "kr";
    return isNegative ? `-${formatted}` : formatted;
  };

  // Kategorisera konton enligt BAS-kontoplan
  const kategoriseraKonton = (konton: HuvudboksKonto[]) => {
    const kategorier = [
      { namn: "Tillgångar", pattern: /^1/, konton: [] as HuvudboksKonto[] },
      { namn: "Eget kapital och skulder", pattern: /^2/, konton: [] as HuvudboksKonto[] },
      { namn: "Intäkter", pattern: /^3/, konton: [] as HuvudboksKonto[] },
      { namn: "Kostnader", pattern: /^[4-8]/, konton: [] as HuvudboksKonto[] },
    ];

    konton.forEach((konto) => {
      const kategori = kategorier.find((k) => k.pattern.test(konto.kontonummer));
      if (kategori) {
        kategori.konton.push(konto);
      }
    });

    return kategorier.filter((k) => k.konton.length > 0);
  };
  //#endregion

  //#region Export Functions
  const handleExportPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Header
    let y = 30;
    doc.setFontSize(32);
    doc.text("Huvudbok", 105, y, { align: "center" });

    y += 20;

    if (företagsnamn) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(företagsnamn, 14, y);
      y += 7;
    }

    if (organisationsnummer) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(organisationsnummer, 14, y);
      y += 8;
    }

    doc.setFontSize(12);
    doc.text(`Utskriven: ${new Date().toISOString().slice(0, 10)}`, 14, y);
    y += 18;

    // Tabelldata
    const tableData = huvudboksdata.map((konto) => [
      konto.kontonummer,
      konto.beskrivning,
      formatSEKforPDF(konto.ingaendeBalans),
      formatSEKforPDF(konto.utgaendeBalans),
    ]);

    autoTable(doc, {
      startY: y,
      head: [["Konto", "Beskrivning", "Ingående balans", "Utgående balans"]],
      body: tableData,
      theme: "striped",
      styles: { fontSize: 10, textColor: "#111", halign: "left" },
      headStyles: { fontStyle: "bold", fillColor: "#f3f4f6" },
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 80 },
        2: { cellWidth: 35, halign: "right" },
        3: { cellWidth: 35, halign: "right" },
      },
    });

    doc.save("huvudbok.pdf");
  };

  const handleExportCSV = () => {
    let csv = "Konto;Beskrivning;Ingående balans;Utgående balans\n";

    huvudboksdata.forEach((konto) => {
      csv +=
        [
          konto.kontonummer,
          `"${konto.beskrivning}"`,
          formatSEK(konto.ingaendeBalans),
          formatSEK(konto.utgaendeBalans),
        ].join(";") + "\n";
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "huvudbok.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  //#endregion

  const kategoriseradeKonton = kategoriseraKonton(huvudboksdata);

  return (
    <MainLayout>
      <div className="mx-auto px-4 text-white">
        <h1 className="text-3xl text-center mb-8">Huvudbok</h1>

        <div className="space-y-6">
          {kategoriseradeKonton.map((kategori) => {
            // Beräkna totalsumma för kategorin
            const totalSumma = kategori.konton.reduce(
              (sum, konto) => sum + konto.utgaendeBalans,
              0
            );

            return (
              <AnimeradFlik
                key={kategori.namn}
                title={kategori.namn}
                icon={
                  kategori.namn === "Tillgångar"
                    ? "🏗️"
                    : kategori.namn === "Eget kapital och skulder"
                      ? "💰"
                      : kategori.namn === "Intäkter"
                        ? "💵"
                        : "💸"
                }
                visaSummaDirekt={formatSEK(totalSumma)}
              >
                <div className="bg-gray-800 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-700">
                        <th className="text-left p-3 font-semibold">Konto</th>
                        <th className="text-left p-3 font-semibold">Beskrivning</th>
                        <th className="text-right p-3 font-semibold">Ingående balans</th>
                        <th className="text-right p-3 font-semibold">Utgående balans</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kategori.konton.map((konto, index) => (
                        <tr
                          key={konto.kontonummer}
                          className={`border-b border-gray-600 hover:bg-gray-750 ${
                            index % 2 === 0 ? "bg-gray-800" : "bg-gray-750"
                          }`}
                        >
                          <td className="p-3">{konto.kontonummer}</td>
                          <td className="p-3">{konto.beskrivning}</td>
                          <td className="p-3 text-right">{formatSEK(konto.ingaendeBalans)}</td>
                          <td className="p-3 text-right font-semibold">
                            {formatSEK(konto.utgaendeBalans)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </AnimeradFlik>
            );
          })}
        </div>

        <div className="flex mt-8 gap-4 justify-end">
          <Knapp text="Ladda ner PDF" onClick={handleExportPDF} />
          <Knapp text="Ladda ner CSV" onClick={handleExportCSV} />
        </div>
      </div>
    </MainLayout>
  );
}
