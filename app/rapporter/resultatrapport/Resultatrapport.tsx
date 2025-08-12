//#region Imports och types
"use client";

import { useState } from "react";
import AnimeradFlik from "../../_components/AnimeradFlik";
import MainLayout from "../../_components/MainLayout";
import Totalrad from "../../_components/Totalrad";
import Tabell, { ColumnDefinition } from "../../_components/Tabell";
import Knapp from "../../_components/Knapp";
import VerifikatModal from "../../_components/VerifikatModal";
import { formatSEK } from "../../_utils/format";
import jsPDF from "jspdf";

type Konto = {
  kontonummer: string;
  beskrivning: string;
  transaktioner?: Array<{
    id: string;
    datum: string;
    belopp: number;
    beskrivning: string;
    transaktion_id: number;
    verifikatNummer: string;
  }>;
  [year: string]: number | string | undefined | Array<any>;
};

type KontoRad = {
  namn: string;
  konton: Konto[];
  summering: { [year: string]: number };
};

type ResultatData = {
  intakter: KontoRad[];
  rorelsensKostnader: KontoRad[];
  finansiellaIntakter?: KontoRad[];
  finansiellaKostnader: KontoRad[];
  ar: string[];
};

type Props = {
  initialData: ResultatData;
  företagsnamn?: string;
  organisationsnummer?: string;
};
//#endregion

export default function Resultatrapport({ initialData }: Props) {
  //#region State & Variables
  const data = initialData;
  // Vi tar de år som faktiskt har data, begränsat till max 2 år
  const years = data.ar.slice(0, 2);
  const [verifikatId, setVerifikatId] = useState<number | null>(null);
  const [expandedKonto, setExpandedKonto] = useState<string | null>(null);
  //#endregion

  //#region Helper Functions
  const summering = (rader: KontoRad[] = []) => {
    const result: Record<string, number> = {};
    for (const rad of rader) {
      for (const year of data.ar) {
        const value = typeof rad.summering[year] === "number" ? rad.summering[year] : 0;
        result[year] = (result[year] || 0) + value;
      }
    }
    return result;
  };

  const formatSEKforPDF = (val: number) => {
    if (val === 0) return "0";
    const isNegative = val < 0;
    const absVal = Math.abs(val);
    const formatted = Math.round(absVal).toLocaleString("sv-SE");
    return isNegative ? `-${formatted}` : formatted;
  };
  //#endregion

  //#region Data Calculations
  const intaktsSumRaw = summering(data.intakter);
  const intaktsSum: Record<string, number> = {};
  for (const year of data.ar) {
    intaktsSum[year] = -intaktsSumRaw[year] || 0;
  }

  const rorelsensSum = summering(data.rorelsensKostnader);
  const finansiellaIntakterSum = summering(data.finansiellaIntakter);
  const finansiellaKostnaderSum = summering(data.finansiellaKostnader);

  const rorelsensResultat: Record<string, number> = {};
  data.ar.forEach((year) => {
    rorelsensResultat[year] = (intaktsSum[year] ?? 0) - (rorelsensSum[year] ?? 0);
  });

  const resultatEfterFinansiella: Record<string, number> = {};
  data.ar.forEach((year) => {
    resultatEfterFinansiella[year] =
      (rorelsensResultat[year] ?? 0) +
      (finansiellaIntakterSum[year] ?? 0) -
      (finansiellaKostnaderSum[year] ?? 0);
  });

  const resultat: Record<string, number> = {};
  data.ar.forEach((year) => {
    resultat[year] = resultatEfterFinansiella[year];
  });
  //#endregion

  //#region Transaction Rendering
  // Funktion för att visa transaktioner när konto expanderas
  const renderTransaktioner = (konto: Konto) => {
    if (!konto.transaktioner || konto.transaktioner.length === 0) {
      return (
        <tr>
          <td colSpan={3} className="px-6 py-4 text-gray-500 text-center">
            Konto {konto.kontonummer} saknar transaktioner i den valda perioden
          </td>
        </tr>
      );
    }

    return (
      <>
        {konto.transaktioner.map((transaktion, index) => {
          // Formatera datum korrekt
          const formatDaterat = (datum: string | Date) => {
            if (typeof datum === "string") {
              return datum.split("T")[0];
            }
            return new Date(datum).toLocaleDateString("sv-SE");
          };

          // Extrahera V-nummer från beskrivning
          const extractVNumber = () => {
            if (transaktion.beskrivning && transaktion.beskrivning.includes("V:")) {
              const match = transaktion.beskrivning.match(/V:(\d+)/);
              if (match) {
                return `V${match[1]}`;
              }
            }
            return transaktion.verifikatNummer || `V${transaktion.transaktion_id}`;
          };

          const vNumber = extractVNumber();

          // Bestäm hur belopp ska visas baserat på kontotyp
          // Intäktskonton (3xxx): visa som negativa belopp
          // Kostnadskonton (4xxx-7xxx): visa som positiva belopp
          const isIntaktskonto = konto.kontonummer.startsWith("3");
          const visatBelopp = isIntaktskonto
            ? -Math.abs(transaktion.belopp)
            : Math.abs(transaktion.belopp);

          // Debug: Logga för första transaktionen
          if (index === 0) {
            console.log(`Debug konto ${konto.kontonummer}:`, {
              originalBelopp: transaktion.belopp,
              isIntaktskonto,
              visatBelopp,
            });
          }

          return (
            <tr
              key={index}
              className={`${
                index % 2 === 0 ? "bg-gray-800" : "bg-gray-850"
              } hover:bg-gray-700 cursor-pointer`}
              onClick={() => setVerifikatId(transaktion.transaktion_id)}
            >
              <td className="px-6 py-2 text-blue-400 text-sm">{vNumber}</td>
              <td className="px-6 py-2 text-gray-300 text-sm">
                {formatDaterat(transaktion.datum)}
              </td>
              <td className="px-6 py-2 text-gray-300 text-sm text-right">
                {formatSEK(visatBelopp)}
              </td>
            </tr>
          );
        })}
      </>
    );
  };

  const handleKontoClick = (kontonummer: string) => {
    setExpandedKonto(expandedKonto === kontonummer ? null : kontonummer);
  };
  //#endregion

  //#region Render Functions
  const renderGrupper = (rader: KontoRad[] = [], isIntakt = false, icon?: string) =>
    rader.map((grupp) => (
      <AnimeradFlik
        key={grupp.namn}
        title={grupp.namn}
        icon={icon || (isIntakt ? "💰" : "💸")}
        visaSummaDirekt={formatSEK(
          isIntakt ? -grupp.summering[years[0]] : grupp.summering[years[0]]
        )}
      >
        <Tabell
          data={[
            ...grupp.konton.map((konto) => ({
              kontonummer: konto.kontonummer,
              Konto: `${konto.kontonummer} ${konto.beskrivning}`,
              Datum: "",
              Belopp: isIntakt ? -(konto[years[0]] as number) : (konto[years[0]] as number),
            })),
            // Summeringsrad
            {
              kontonummer: "",
              Konto: `Summa ${grupp.namn.toLowerCase()}`,
              Datum: "",
              Belopp: isIntakt ? -grupp.summering[years[0]] : grupp.summering[years[0]],
            },
          ]}
          columns={[
            {
              key: "Konto",
              label: "Konto",
              render: (_, item: any) => item.Konto,
            },
            {
              key: "Datum",
              label: "Datum",
              className: "text-center",
              render: (_, item: any) => item.Datum || "",
            },
            {
              key: "Belopp",
              label: "Belopp",
              className: "text-right",
              render: (_, item: any) => formatSEK(item.Belopp),
            },
          ]}
          getRowId={(item: any) => item.kontonummer || "summa"}
          activeId={expandedKonto}
          renderExpandedRow={(item: any) =>
            item.kontonummer
              ? renderTransaktioner(grupp.konton.find((k) => k.kontonummer === item.kontonummer)!)
              : null
          }
          handleRowClick={(id) => handleKontoClick(String(id))}
        />
      </AnimeradFlik>
    ));
  //#endregion

  //#region Exportfunktioner
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header - förenklat utan session för nu
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Resultatrapport", 14, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    // Placeholder företagsinformation
    doc.text("ANGBERG, ROBERT", 14, 30);
    doc.text("8306186910", 14, 36);

    // Datum och period information
    const currentDate = new Date().toLocaleDateString("sv-SE");
    const currentYear = years[0];

    doc.text(`Räkenskapsår: ${currentYear}-01-01 till ${currentYear}-12-31`, 14, 46);
    doc.text(`Utskriven: ${currentDate}`, pageWidth - 60, 46);
    doc.text(`Period: ${currentYear}-01-01 till ${currentYear}-12-31`, 14, 52);
    doc.text(`Senaste ver. nr.: V116`, pageWidth - 60, 52);

    let y = 70;

    // Rörelsens intäkter - sektion
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Rörelsens intäkter", 14, y);
    y += 10;

    // Nettoomsättning underrubrik
    doc.setFontSize(11);
    doc.text("Nettoomsättning", 20, y);
    y += 8;

    // Intäktskonton med belopp högerställt
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    let nettoomsattningTotal = 0;
    data.intakter.forEach((grupp) => {
      grupp.konton.forEach((konto) => {
        const belopp = (konto[years[0]] as number) || 0;
        nettoomsattningTotal += belopp;
        doc.text(`${konto.kontonummer} ${konto.beskrivning}`, 26, y);
        doc.text(formatSEKforPDF(belopp), pageWidth - 40, y, { align: "right" });
        y += 6;
      });
    });

    // Nettoomsättning summa
    y += 3;
    doc.setFont("helvetica", "normal");
    doc.text(formatSEKforPDF(nettoomsattningTotal), pageWidth - 40, y, { align: "right" });
    y += 8;

    // Summa rörelsens intäkter
    doc.setFont("helvetica", "bold");
    doc.text("Summa rörelsens intäkter", 14, y);
    doc.text(formatSEKforPDF(nettoomsattningTotal), pageWidth - 40, y, { align: "right" });
    y += 15;

    // Rörelsens kostnader - sektion
    doc.setFontSize(12);
    doc.text("Rörelsens kostnader", 14, y);
    y += 10;

    let totalKostnader = 0;

    // Gruppera kostnader enligt Bokio's struktur
    data.rorelsensKostnader.forEach((grupp) => {
      // Kategorinamn som underrubrik
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(grupp.namn, 20, y);
      y += 8;

      // Konton under kategorin
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      let kategoriTotal = 0;

      grupp.konton.forEach((konto) => {
        const belopp = (konto[years[0]] as number) || 0;
        kategoriTotal += belopp;
        totalKostnader += belopp;

        doc.text(`${konto.kontonummer} ${konto.beskrivning}`, 26, y);
        doc.text(formatSEKforPDF(belopp), pageWidth - 40, y, { align: "right" });
        y += 6;
      });

      // Kategori summa
      y += 3;
      doc.setFont("helvetica", "normal");
      doc.text(formatSEKforPDF(kategoriTotal), pageWidth - 40, y, { align: "right" });
      y += 10;
    });

    // Summa rörelsens kostnader
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Summa rörelsens kostnader", 14, y);
    doc.text(formatSEKforPDF(-totalKostnader), pageWidth - 40, y, { align: "right" });
    y += 15;

    // Rörelsens resultat
    const rorelsensResultat = nettoomsattningTotal - totalKostnader;
    doc.setFontSize(12);
    doc.text("Rörelsens resultat", 14, y);
    y += 8;
    doc.setFontSize(11);
    doc.text("Summa rörelsens resultat", 14, y);
    doc.text(formatSEKforPDF(rorelsensResultat), pageWidth - 40, y, { align: "right" });
    y += 15;

    // Resultat efter finansiella poster
    doc.setFontSize(12);
    doc.text("Resultat efter finansiella poster", 14, y);
    y += 8;
    doc.setFontSize(11);
    doc.text("Resultat efter finansiella poster", 14, y);
    doc.text(formatSEKforPDF(rorelsensResultat), pageWidth - 40, y, { align: "right" });
    y += 15;

    // Beräknat resultat
    doc.setFontSize(12);
    doc.text("Beräknat resultat", 14, y);
    y += 8;
    doc.setFontSize(11);
    doc.text("Beräknat resultat", 14, y);
    doc.text(formatSEKforPDF(rorelsensResultat), pageWidth - 40, y, { align: "right" });

    doc.save("resultatrapport.pdf");
  };

  const handleExportCSV = () => {
    let csv = "Rubrik;Konto;Belopp\n";
    // Intäkter
    data.intakter.forEach((grupp) => {
      grupp.konton.forEach((konto) => {
        csv += `Rörelsens intäkter;${konto.kontonummer} – ${konto.beskrivning};${-(konto[years[0]] as number)}\n`;
      });
      csv += `Rörelsens intäkter;Summa ${grupp.namn.toLowerCase()};${-grupp.summering[years[0]]}\n`;
    });
    csv += `Rörelsens intäkter;Summa rörelsens intäkter;${intaktsSum[years[0]]}\n`;

    // Kostnader
    data.rorelsensKostnader.forEach((grupp) => {
      grupp.konton.forEach((konto) => {
        csv += `Rörelsens kostnader;${konto.kontonummer} – ${konto.beskrivning};${konto[years[0]]}\n`;
      });
      csv += `Rörelsens kostnader;Summa ${grupp.namn.toLowerCase()};${grupp.summering[years[0]]}\n`;
    });
    csv += `Rörelsens kostnader;Summa rörelsens kostnader;${rorelsensSum[years[0]]}\n`;

    // Rörelsens resultat
    csv += `Rörelsens resultat;Summa rörelsens resultat;${rorelsensResultat[years[0]]}\n`;

    // Finansiella intäkter
    if (data.finansiellaIntakter && data.finansiellaIntakter.length > 0) {
      data.finansiellaIntakter.forEach((grupp) => {
        grupp.konton.forEach((konto) => {
          csv += `Finansiella intäkter;${konto.kontonummer} – ${konto.beskrivning};${konto[years[0]]}\n`;
        });
        csv += `Finansiella intäkter;Summa ${grupp.namn.toLowerCase()};${grupp.summering[years[0]]}\n`;
      });
      csv += `Finansiella intäkter;Summa finansiella intäkter;${finansiellaIntakterSum[years[0]]}\n`;
    }

    // Finansiella kostnader
    if (data.finansiellaKostnader && data.finansiellaKostnader.length > 0) {
      data.finansiellaKostnader.forEach((grupp) => {
        grupp.konton.forEach((konto) => {
          csv += `Finansiella kostnader;${konto.kontonummer} – ${konto.beskrivning};${konto[years[0]]}\n`;
        });
        csv += `Finansiella kostnader;Summa ${grupp.namn.toLowerCase()};${grupp.summering[years[0]]}\n`;
      });
      csv += `Finansiella kostnader;Summa finansiella kostnader;${finansiellaKostnaderSum[years[0]]}\n`;
    }

    // Resultat efter finansiella poster
    csv += `Resultat efter finansiella poster;Resultat efter finansiella poster;${resultatEfterFinansiella[years[0]]}\n`;

    // Beräknat resultat
    csv += `Beräknat resultat;Beräknat resultat;${resultat[years[0]]}\n`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resultatrapport.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  //#endregion

  return (
    <MainLayout>
      <div className="mx-auto px-4 text-white">
        <h1 className="text-3xl text-center mb-8">Resultatrapport</h1>

        {/* Rörelsens intäkter */}
        <h2 className="text-xl font-semibold mt-10 mb-4">Rörelsens intäkter</h2>
        {renderGrupper(data.intakter, true, "💰")}
        <Totalrad
          label="Summa rörelsens intäkter"
          values={years.reduce((acc, year) => ({ ...acc, [year]: intaktsSum[year] ?? 0 }), {})}
        />

        {/* Rörelsens kostnader */}
        <h2 className="text-xl font-semibold mt-10 mb-4">Rörelsens kostnader</h2>
        {renderGrupper(data.rorelsensKostnader, false, "💸")}
        <Totalrad
          label="Summa rörelsens kostnader"
          values={years.reduce((acc, year) => ({ ...acc, [year]: -rorelsensSum[year] || 0 }), {})}
        />

        {/* Rörelsens resultat */}
        <h2 className="text-xl font-semibold mt-10 mb-4">Rörelsens resultat</h2>
        <Totalrad
          label="Summa rörelsens resultat"
          values={years.reduce(
            (acc, year) => ({ ...acc, [year]: rorelsensResultat[year] ?? 0 }),
            {}
          )}
        />

        {/* Finansiella intäkter */}
        {data.finansiellaIntakter && data.finansiellaIntakter.length > 0 && (
          <>
            <h2 className="text-xl font-semibold mt-10 mb-4">Finansiella intäkter</h2>
            {renderGrupper(data.finansiellaIntakter, false, "💰")}
            <Totalrad
              label="Summa finansiella intäkter"
              values={years.reduce(
                (acc, year) => ({ ...acc, [year]: finansiellaIntakterSum[year] ?? 0 }),
                {}
              )}
            />
          </>
        )}

        {/* Finansiella kostnader */}
        {data.finansiellaKostnader && data.finansiellaKostnader.length > 0 && (
          <>
            <h2 className="text-xl font-semibold mt-10 mb-4">Finansiella kostnader</h2>
            {renderGrupper(data.finansiellaKostnader, false, "💸")}
            <Totalrad
              label="Summa finansiella kostnader"
              values={years.reduce(
                (acc, year) => ({ ...acc, [year]: finansiellaKostnaderSum[year] ?? 0 }),
                {}
              )}
            />
          </>
        )}

        {/* Resultat efter finansiella poster */}
        <h2 className="text-xl font-semibold mt-10 mb-4">Resultat efter finansiella poster</h2>
        <Totalrad
          label="Resultat efter finansiella poster"
          values={years.reduce(
            (acc, year) => ({ ...acc, [year]: resultatEfterFinansiella[year] ?? 0 }),
            {}
          )}
        />

        {/* Beräknat resultat */}
        <h2 className="text-xl font-semibold mt-10 mb-4">Beräknat resultat</h2>
        <Totalrad
          label="Beräknat resultat"
          values={years.reduce((acc, year) => ({ ...acc, [year]: resultat[year] ?? 0 }), {})}
        />
      </div>

      {/* Modal för verifikat */}
      {verifikatId && (
        <VerifikatModal transaktionsId={verifikatId} onClose={() => setVerifikatId(null)} />
      )}

      <div className="flex mt-8 gap-4 justify-end">
        <Knapp text="Ladda ner PDF" onClick={handleExportPDF} />
        <Knapp text="Ladda ner CSV" onClick={handleExportCSV} />
      </div>
    </MainLayout>
  );
}
