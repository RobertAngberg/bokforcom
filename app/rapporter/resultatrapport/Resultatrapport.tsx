//#region Imports och types
"use client";

import { useState } from "react";
import AnimeradFlik from "../../_components/AnimeradFlik";
import MainLayout from "../../_components/MainLayout";
import Totalrad from "../../_components/Totalrad";
import Tabell, { ColumnDefinition } from "../../_components/Tabell";
import Knapp from "../../_components/Knapp";
import VerifikatModal from "../../_components/VerifikatModal";
import Modal from "../../_components/Modal";
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
  const data = initialData || {
    ar: [],
    intakter: [],
    rorelsensKostnader: [],
    finansiellaIntakter: [],
    finansiellaKostnader: [],
  };
  const years = [...data.ar].sort((a, b) => parseInt(b) - parseInt(a));
  const [verifikatId, setVerifikatId] = useState<number | null>(null);
  const [expandedKonto, setExpandedKonto] = useState<string | null>(null);

  // State för verifikatmodal
  const [showModal, setShowModal] = useState(false);
  const [selectedKonto, setSelectedKonto] = useState("");
  const [verifikationer, setVerifikationer] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [exportMessage, setExportMessage] = useState<string>("");

  // Funktion för att visa verifikationer för ett konto
  const handleShowVerifikationer = async (kontonummer: string) => {
    setSelectedKonto(kontonummer);
    setShowModal(true);
    setLoading(true);

    try {
      // Hämta riktiga verifikationer från databasen
      const response = await fetch(`/api/verifikationer?konto=${kontonummer}`);
      if (response.ok) {
        const data = await response.json();
        setVerifikationer(data);
      } else {
        setVerifikationer([]);
      }
    } catch (error) {
      console.error("Fel vid hämtning av verifikationer:", error);
      setVerifikationer([]);
    } finally {
      setLoading(false);
    }
  };
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
    intaktsSum[year] = intaktsSumRaw[year] || 0; // Intäkter ska vara positiva
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

  const handleKontoClick = (id: string | number) => {
    const kontonummer = String(id);
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
          isIntakt ? grupp.summering[years[0]] : grupp.summering[years[0]]
        )}
        forcedOpen={true}
      >
        <Tabell
          data={[
            ...grupp.konton.map((konto) => ({
              kontonummer: konto.kontonummer,
              beskrivning: konto.beskrivning,
              ...years.reduce(
                (acc, year) => {
                  acc[year] = isIntakt ? (konto[year] as number) : (konto[year] as number);
                  return acc;
                },
                {} as Record<string, number>
              ),
              transaktioner: konto.transaktioner || [],
            })),
          ]}
          columns={[
            {
              key: "beskrivning",
              label: "Konto",
              render: (_, item: any) =>
                item.kontonummer ? (
                  <button
                    onClick={() => handleKontoClick(item.kontonummer)}
                    className="text-left hover:text-cyan-400 cursor-pointer bg-transparent border-none p-0"
                  >
                    {item.kontonummer} – {item.beskrivning}
                  </button>
                ) : (
                  item.beskrivning
                ),
            },
            ...years.map((year) => ({
              key: year,
              label: year,
              className: "text-right",
              render: (_, item: any) => formatSEK(item[year] || 0),
            })),
            {
              key: "verifikationer",
              label: "",
              render: (value: any, item: any) => null, // Ta bort "Visa"-knappen
            },
          ]}
          getRowId={(item: any) => item.kontonummer || "summa"}
          activeId={expandedKonto}
          handleRowClick={handleKontoClick}
          renderExpandedRow={(item: any) => {
            if (!item.transaktioner || item.transaktioner.length === 0) {
              return (
                <tr>
                  <td colSpan={years.length + 2} className="px-6 py-4 text-gray-500 text-center">
                    Konto {item.kontonummer} saknar transaktioner i den valda perioden
                  </td>
                </tr>
              );
            }

            return (
              <>
                {item.transaktioner.map((transaktion: any, index: number) => (
                  <tr key={`${item.kontonummer}-${index}`} className="bg-slate-800">
                    <td
                      className="px-6 py-2 text-sm text-blue-400 cursor-pointer hover:text-cyan-400"
                      onClick={() => setVerifikatId(transaktion.transaktion_id)}
                    >
                      {transaktion.verifikatNummer}
                    </td>
                    <td className="px-6 py-2 text-sm text-gray-300">{transaktion.beskrivning}</td>
                    <td className="px-6 py-2 text-sm text-gray-300 text-right">
                      {formatSEK(Math.abs(transaktion.belopp))}
                    </td>
                    <td className="px-6 py-2"></td>
                    <td className="px-6 py-2"></td>
                    <td className="px-6 py-2"></td>
                  </tr>
                ))}
              </>
            );
          }}
        />

        {/* Summeringsrad efter tabellen */}
        <div className="mt-2 p-4 bg-slate-800 border-t">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Summa {grupp.namn.toLowerCase()}</span>
            <div className="flex gap-8">
              {years.map((year) => (
                <span key={year} className="font-semibold min-w-[100px] text-right">
                  {formatSEK(isIntakt ? grupp.summering[year] : grupp.summering[year])} kr
                </span>
              ))}
            </div>
          </div>
        </div>
      </AnimeradFlik>
    ));
  //#endregion

  //#region Exportfunktioner
  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    setExportMessage("");

    try {
      // Validera data
      if (!data || !data.ar || data.ar.length === 0) {
        throw new Error("Ingen rapportdata att exportera");
      }

      if (!years || years.length === 0) {
        throw new Error("Inga år valda för rapporten");
      }

      // Kontrollera att det finns faktisk data att exportera
      const hasData =
        data.intakter?.some((gruppe) => gruppe.konton.length > 0) ||
        data.rorelsensKostnader?.some((gruppe) => gruppe.konton.length > 0);

      if (!hasData) {
        throw new Error("Ingen transaktionsdata att exportera för valt år");
      }

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

      setExportMessage("PDF-rapport exporterad framgångsrikt!");
      setTimeout(() => setExportMessage(""), 3000);
    } catch (error) {
      console.error("PDF export error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Ett oväntat fel uppstod vid PDF-export";
      setExportMessage(`Fel: ${errorMessage}`);
      setTimeout(() => setExportMessage(""), 5000);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportCSV = async () => {
    setIsExportingCSV(true);
    setExportMessage("");

    try {
      // Validera data
      if (!data || !data.ar || data.ar.length === 0) {
        throw new Error("Ingen rapportdata att exportera");
      }

      if (!years || years.length === 0) {
        throw new Error("Inga år valda för rapporten");
      }

      // Kontrollera att det finns faktisk data att exportera
      const hasData =
        data.intakter?.some((gruppe) => gruppe.konton.length > 0) ||
        data.rorelsensKostnader?.some((gruppe) => gruppe.konton.length > 0);

      if (!hasData) {
        throw new Error("Ingen transaktionsdata att exportera för valt år");
      }

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

      if (!csv || csv.length < 50) {
        throw new Error("Fel vid generering av CSV-data");
      }

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "resultatrapport.csv";
      a.click();
      URL.revokeObjectURL(url);

      setExportMessage("CSV-rapport exporterad framgångsrikt!");
      setTimeout(() => setExportMessage(""), 3000);
    } catch (error) {
      console.error("CSV export error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Ett oväntat fel uppstod vid CSV-export";
      setExportMessage(`Fel: ${errorMessage}`);
      setTimeout(() => setExportMessage(""), 5000);
    } finally {
      setIsExportingCSV(false);
    }
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

      {/* Verifikatmodal för kontoverifikationer */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`Verifikationer för konto ${selectedKonto}`}
      >
        {loading ? (
          <div className="text-center p-4">Laddar verifikationer...</div>
        ) : (
          <Tabell
            data={verifikationer}
            columns={[
              { key: "datum", label: "Datum", render: (value: any) => value },
              { key: "beskrivning", label: "Beskrivning", render: (value: any) => value },
              {
                key: "debet",
                label: "Debet",
                render: (value: any) => (value > 0 ? `${value}kr` : "−"),
              },
              {
                key: "kredit",
                label: "Kredit",
                render: (value: any) => (value > 0 ? `${value}kr` : "−"),
              },
              { key: "saldo", label: "Saldo", render: (value: any) => `${value}kr` },
            ]}
            getRowId={(row) => row.id}
          />
        )}
      </Modal>

      {exportMessage && (
        <div
          className={`text-center mb-4 p-3 rounded-lg ${
            exportMessage.startsWith("Fel:")
              ? "bg-red-100 text-red-700 border border-red-300"
              : "bg-green-100 text-green-700 border border-green-300"
          }`}
        >
          {exportMessage}
        </div>
      )}

      <div className="flex mt-8 gap-4 justify-end">
        <button
          onClick={handleExportPDF}
          disabled={isExportingPDF}
          className={`px-6 py-2 text-white rounded-lg transition-colors flex items-center gap-2 ${
            isExportingPDF ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isExportingPDF ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Exporterar PDF...
            </>
          ) : (
            "Ladda ner PDF"
          )}
        </button>

        <button
          onClick={handleExportCSV}
          disabled={isExportingCSV}
          className={`px-6 py-2 text-white rounded-lg transition-colors flex items-center gap-2 ${
            isExportingCSV ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {isExportingCSV ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Exporterar CSV...
            </>
          ) : (
            "Ladda ner CSV"
          )}
        </button>
      </div>
    </MainLayout>
  );
}
