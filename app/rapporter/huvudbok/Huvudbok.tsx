// #region Imports och types
"use client";

import React, { useEffect, useState } from "react";
import MainLayout from "../../_components/MainLayout";
import AnimeradFlik from "../../_components/AnimeradFlik";
import InreTabell from "../../_components/InreTabell";
import Knapp from "../../_components/Knapp";
import VerifikatModal from "../../_components/VerifikatModal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type TransactionItem = {
  kontonummer: string;
  kontobeskrivning_konto: string; // Kontonamn från konton-tabellen
  kontobeskrivning: string; // Transaktionsbeskrivning från transaktioner-tabellen
  transaktionsdatum: string;
  fil: string;
  debet: number;
  kredit: number;
  transaktion_id?: number;
  verifikatNummer?: string;
};

type GroupedTransactions = {
  [konto: string]: TransactionItem[];
};

type Props = {
  initialData: TransactionItem[];
  företagsnamn?: string;
  organisationsnummer?: string;
};
// #endregion

export default function Huvudbok({ initialData, företagsnamn, organisationsnummer }: Props) {
  //#region State & Variables
  const [groupedData, setGroupedData] = useState<GroupedTransactions>({});
  const [verifikatId, setVerifikatId] = useState<number | null>(null);
  //#endregion

  //#region Data Processing
  useEffect(() => {
    // Debug: kolla vad som finns i datan
    console.log("Initial data:", initialData[0]);

    const grouped = initialData.reduce<GroupedTransactions>((acc, item) => {
      const key = item.kontonummer;
      (acc[key] ??= []).push({
        ...item,
        // Fixa datum-hantering - hantera både Date-objekt och strängar
        transaktionsdatum:
          typeof item.transaktionsdatum === "string"
            ? item.transaktionsdatum.slice(0, 10)
            : new Date(item.transaktionsdatum).toISOString().slice(0, 10),
      });
      return acc;
    }, {});
    setGroupedData(grouped);
  }, [initialData]);
  //#endregion

  //#region Helper Functions
  // Rensar ALLA icke-ASCII-tecken från SEK-format
  const formatSEK = (val: number) =>
    val
      .toLocaleString("sv-SE", { style: "currency", currency: "SEK" })
      .replace(/[^0-9a-zA-Z,.−\- ]/g, "") // Behåll både - och −
      .replace(/\s+/g, " ")
      .trim();

  // PDF-biblioteket hanterar inte Unicode-tecken korrekt - använd enkel ASCII-formatering
  const formatSEKforPDF = (val: number) => {
    if (val === 0) return "0,00 kr";
    // Kolla om värdet är negativt
    const isNegative = val < 0;
    // Använd absolut värde för formatering
    const absVal = Math.abs(val);
    // Formatera med 2 decimaler och byt ut punkt mot komma
    const formatted = absVal.toFixed(2).replace(".", ",") + " kr";
    // Lägg till minustecken först om negativt
    return isNegative ? `-${formatted}` : formatted;
  };
  //#endregion

  //#region Export Functions
  // PDF-export med jsPDF-AutoTable
  const handleExportPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Header med extra marginal och företagsnamn i bold
    let y = 30;
    doc.setFontSize(32);
    doc.text("Huvudbok", 105, y, { align: "center" });

    y += 20; // extra marginal under "Huvudbok"

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(String(företagsnamn ?? ""), 14, y);

    doc.setFont("helvetica", "normal");
    y += 6;
    doc.text(String(organisationsnummer ?? ""), 14, y);

    y += 6;
    const utskriftsdatum = new Date().toISOString().slice(0, 10);
    doc.text(`Utskriven: ${utskriftsdatum}`, 14, y);

    y += 18; // extra marginal under header

    const sorted = Object.entries(groupedData).sort(([a], [b]) => a.localeCompare(b, "sv-SE"));

    let lastSection: string | null = null;

    sorted.forEach(([kontoNummer, items]) => {
      const kontoNamn = items[0]?.kontobeskrivning_konto || "";
      const konto = `${kontoNummer} – ${kontoNamn}`;

      let section =
        kontoNummer === "1930"
          ? "Företagskonto"
          : /^26(1|2|3|4)/.test(kontoNummer)
            ? "Momskonton"
            : `Kontoklass ${kontoNummer.charAt(0)}XXX`;

      const showHeading = section !== lastSection;
      lastSection = section;

      let saldo = 0;

      if (showHeading) {
        doc.setFontSize(15);
        doc.text(section, 14, y);
        y += 8;
      }

      doc.setFontSize(12);
      doc.text(konto, 14, y);
      y += 6;
      doc.setFontSize(10);
      doc.text("Ingående balans 0,00 kr", 14, y);
      y += 6;

      // Tabell-data
      const rows = items.map((item) => {
        saldo += (item.debet ?? 0) - (item.kredit ?? 0);
        return [
          item.transaktionsdatum,
          item.kontobeskrivning, // Använd transaktionsbeskrivning
          item.debet ? formatSEKforPDF(item.debet) : "",
          item.kredit ? formatSEKforPDF(item.kredit) : "",
          formatSEKforPDF(saldo),
        ];
      });

      autoTable(doc, {
        startY: y,
        head: [["Datum", "Beskrivning", "Debet", "Kredit", "Saldo"]],
        body: rows,
        theme: "plain",
        styles: { fontSize: 10, textColor: "#111", halign: "left" },
        headStyles: { fontStyle: "bold", textColor: "#111" },
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
          if (data.cursor) {
            y = data.cursor.y + 8;
          }
        },
      });

      doc.setFontSize(10);
      doc.text(`Utgående balans ${formatSEKforPDF(saldo)}`, 200, y - 2, { align: "right" });
      y += 10;
      if (y > 270) {
        doc.addPage();
        y = 22;
      }
    });

    doc.save("huvudbok.pdf");
  };

  // CSV-export
  const handleExportCSV = () => {
    let csv = "Konto;Beskrivning;Datum;Debet;Kredit;Saldo\n";
    Object.entries(groupedData).forEach(([kontoNummer, items]) => {
      let saldo = 0;
      items.forEach((item) => {
        saldo += (item.debet ?? 0) - (item.kredit ?? 0);
        csv +=
          [
            kontoNummer,
            `"${item.kontobeskrivning}"`, // Använd transaktionsbeskrivning
            item.transaktionsdatum,
            item.debet ? formatSEK(item.debet) : "",
            item.kredit ? formatSEK(item.kredit) : "",
            formatSEK(saldo),
          ].join(";") + "\n";
      });
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "huvudbok.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  //#endregion

  return (
    <MainLayout>
      <h1 className="mb-8 text-3xl text-center text-white">Huvudbok</h1>
      <div>
        <div className="space-y-6">
          {(() => {
            const sorted = Object.entries(groupedData).sort(([a], [b]) =>
              a.localeCompare(b, "sv-SE")
            );

            let lastSection: string | null = null;

            return sorted.map(([kontoNummer, items]) => {
              const kontoNamn = items[0]?.kontobeskrivning_konto || "";
              const konto = `${kontoNummer} – ${kontoNamn}`;

              let section =
                kontoNummer === "1930"
                  ? "Företagskonto"
                  : /^26(1|2|3|4)/.test(kontoNummer)
                    ? "Momskonton"
                    : `Kontoklass ${kontoNummer.charAt(0)}XXX`;

              const showHeading = section !== lastSection;
              lastSection = section;

              // Beräkna slutsaldo för detta konto
              let slutSaldo = 0;
              items.forEach((item) => {
                slutSaldo += (item.debet ?? 0) - (item.kredit ?? 0);
              });

              return (
                <div key={konto}>
                  {showHeading && (
                    <h2 className="text-xl text-white font-semibold mb-2">{section}</h2>
                  )}
                  <AnimeradFlik title={konto} icon="📂" visaSummaDirekt={formatSEK(slutSaldo)}>
                    {(() => {
                      let saldo = 0;
                      const rows = items.map((item) => {
                        saldo += (item.debet ?? 0) - (item.kredit ?? 0);

                        return {
                          Datum: item.transaktionsdatum,
                          Beskrivning: item.kontobeskrivning, // Använd transaktionsbeskrivning
                          Verifikat: (
                            <div className="text-left pl-2">
                              <button
                                className={`underline transition-colors ${
                                  item.transaktion_id
                                    ? "text-blue-400 hover:text-blue-300 cursor-pointer"
                                    : "text-gray-500 cursor-not-allowed"
                                }`}
                                onClick={() => {
                                  if (item.transaktion_id) {
                                    setVerifikatId(item.transaktion_id);
                                  }
                                }}
                                disabled={!item.transaktion_id}
                              >
                                {item.verifikatNummer ||
                                  `V${item.transaktion_id}` ||
                                  "Inget verifikat"}
                              </button>
                            </div>
                          ),
                          Debet: item.debet ? formatSEK(item.debet) : "",
                          Kredit: item.kredit ? formatSEK(item.kredit) : "",
                          Saldo: formatSEK(saldo),
                        };
                      });
                      return (
                        <div className="space-y-2">
                          <div className="text-sm text-white font-semibold mb-2">
                            Ingående balans 0,00 kr
                          </div>
                          <InreTabell rows={rows} />
                          <div className="text-sm text-white font-semibold mt-4 text-right">
                            Utgående balans {formatSEK(saldo)}
                          </div>
                        </div>
                      );
                    })()}
                  </AnimeradFlik>
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* Modal för verifikat */}
      {verifikatId && (
        <VerifikatModal
          transaktionsId={verifikatId}
          onClose={() => {
            console.log("Stänger modal");
            setVerifikatId(null);
          }}
        />
      )}

      <div className="flex mt-6 gap-4 justify-end">
        <Knapp text="Ladda ner PDF" onClick={handleExportPDF} />
        <Knapp text="Ladda ner CSV" onClick={handleExportCSV} />
      </div>
    </MainLayout>
  );
}
