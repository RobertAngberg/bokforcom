"use client";

import React, { useState, useEffect } from "react";
import AnimeradFlik from "../../_components/AnimeradFlik";
import MainLayout from "../../_components/MainLayout";
import Totalrad from "../../_components/Totalrad";
import Tabell, { ColumnDefinition } from "../../_components/Tabell";
import Knapp from "../../_components/Knapp";
import VerifikatModal from "../../_components/VerifikatModal";
import Modal from "../../_components/Modal";
import { formatSEK } from "../../_utils/format";
import jsPDF from "jspdf";
import { hamtaResultatrapport, fetchFöretagsprofil } from "./actions";

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

export default function Page() {
  //#region State & Variables
  const [initialData, setInitialData] = useState<ResultatData | null>(null);
  const [företagsnamn, setFöretagsnamn] = useState<string>("");
  const [organisationsnummer, setOrganisationsnummer] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const data = initialData || {
    ar: [],
    intakter: [],
    rorelsensKostnader: [],
    finansiellaIntakter: [],
    finansiellaKostnader: [],
  };
  const years = [...data.ar].sort((a, b) => parseInt(b) - parseInt(a));
  const currentYear = years[0] || new Date().getFullYear().toString();
  const previousYear = years[1] || (parseInt(currentYear) - 1).toString();
  const [verifikatId, setVerifikatId] = useState<number | null>(null);

  // State för verifikatmodal
  const [showModal, setShowModal] = useState(false);
  const [selectedKonto, setSelectedKonto] = useState("");
  const [verifikationer, setVerifikationer] = useState<any[]>([]);
  const [loadingModal, setLoadingModal] = useState(false);

  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [exportMessage, setExportMessage] = useState<string>("");
  //#endregion

  // Ladda data när komponenten mountas
  useEffect(() => {
    const loadData = async () => {
      try {
        const [resultData, profilData] = await Promise.all([
          hamtaResultatrapport(),
          fetchFöretagsprofil(),
        ]);

        setInitialData(resultData);
        setFöretagsnamn(profilData?.företagsnamn ?? "");
        setOrganisationsnummer(profilData?.organisationsnummer ?? "");
      } catch (error) {
        console.error("Fel vid laddning av resultatdata:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Om data fortfarande laddas
  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-white">Laddar resultatrapport...</div>
        </div>
      </MainLayout>
    );
  }

  // Funktion för att visa verifikationer för ett konto
  const handleShowVerifikationer = async (kontonummer: string) => {
    setSelectedKonto(kontonummer);
    setShowModal(true);
    setLoadingModal(true);

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
      setLoadingModal(false);
    }
  };

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
    intaktsSum[year] = -(intaktsSumRaw[year] || 0); // Invertera intäkter för att göra dem positiva i rapporten
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
  //#endregion

  //#region Render Functions
  // BOKIO-STIL render funktion med AnimeradFlik och Tabell - visar alla transaktioner som separata rader!
  const renderGrupper = (rader: KontoRad[] = [], isIntakt = false, icon?: string) =>
    rader.map((grupp) => {
      const kolumner: ColumnDefinition<any>[] = [
        {
          key: "beskrivning",
          label: "Konto",
          render: (_, row) => {
            if (row.isTransaction) {
              // Transaktionsrad - visa bara verifikatnumret, inget annat
              return (
                <div
                  className="ml-4 text-sm text-blue-400 hover:text-blue-300 cursor-pointer"
                  onClick={() => row.transaktion_id && setVerifikatId(row.transaktion_id)}
                >
                  {row.verifikatNummer}
                </div>
              );
            } else if (row.isSummary) {
              // Summeringsrad
              return <div className="font-bold">{row.beskrivning}</div>;
            } else {
              // Kontorad
              return (
                <div className="font-medium">
                  {row.kontonummer} – {row.beskrivning}
                </div>
              );
            }
          },
        },
        {
          key: "IngBalans",
          label: `Ing. balans\n${previousYear}-01-01`,
          className: "text-right whitespace-pre-line",
          render: (_, row: any) => {
            if (row.isTransaction) {
              return "";
            }
            // Invertera intäkter för att visa dem som positiva
            const value = row[previousYear] || 0;
            const displayValue = isIntakt ? -value : value;
            return formatSEK(displayValue);
          },
        },
        {
          key: "Resultat",
          label: "Resultat",
          className: "text-right",
          render: (_, row: any) => {
            if (row.isTransaction) {
              return <div className="text-right">{formatSEK(row.belopp)}</div>;
            }
            // Invertera intäkter för att visa dem som positiva
            const value = row[currentYear] || 0;
            const displayValue = isIntakt ? -value : value;
            return formatSEK(displayValue);
          },
        },
        {
          key: "UtgBalans",
          label: `Utg. balans\n${currentYear}-12-31`,
          className: "text-right whitespace-pre-line",
          render: (_, row: any) => {
            if (row.isTransaction) {
              return "";
            }
            // Invertera intäkter för att visa dem som positiva
            const currentYearValue = row[currentYear] || 0;
            const previousYearValue = row[previousYear] || 0;
            const currentDisplay = isIntakt ? -currentYearValue : currentYearValue;
            const previousDisplay = isIntakt ? -previousYearValue : previousYearValue;
            return formatSEK(previousDisplay + currentDisplay);
          },
        },
      ];

      // Expandera konton till tabellrader med alla transaktioner
      const tabellData: any[] = [];

      grupp.konton.forEach((konto) => {
        // Lägg till kontorad
        tabellData.push({
          id: konto.kontonummer,
          kontonummer: konto.kontonummer,
          beskrivning: konto.beskrivning,
          ...years.reduce(
            (acc, year) => {
              acc[year] = konto[year] as number;
              return acc;
            },
            {} as Record<string, number>
          ),
          isTransaction: false,
          isSummary: false,
        });

        // Lägg till alla transaktioner som separata rader
        if (konto.transaktioner && konto.transaktioner.length > 0) {
          konto.transaktioner.forEach((transaktion) => {
            tabellData.push({
              id: transaktion.id,
              beskrivning: transaktion.beskrivning,
              belopp: transaktion.belopp,
              verifikatNummer: transaktion.verifikatNummer,
              transaktion_id: transaktion.transaktion_id,
              kontonummer: konto.kontonummer,
              isTransaction: true,
              isSummary: false,
            });
          });
        } else {
          // Lägg till rad som visar att kontot saknar transaktioner
          tabellData.push({
            id: `${konto.kontonummer}-empty`,
            beskrivning: `Konto ${konto.kontonummer} saknar transaktioner i den valda perioden`,
            kontonummer: konto.kontonummer,
            isTransaction: false,
            isSummary: false,
            isEmpty: true,
          });
        }
      });

      // Lägg till summeringsrad
      tabellData.push({
        id: "SUMMA",
        beskrivning: `Summa ${grupp.namn.toLowerCase()}`,
        ...years.reduce(
          (acc, year) => {
            acc[year] = grupp.summering[year];
            return acc;
          },
          {} as Record<string, number>
        ),
        isTransaction: false,
        isSummary: true,
      });

      return (
        <AnimeradFlik
          key={grupp.namn}
          title={grupp.namn}
          icon={icon || (isIntakt ? "💰" : "💸")}
          visaSummaDirekt={formatSEK(
            isIntakt ? -grupp.summering[years[0]] : grupp.summering[years[0]]
          )}
        >
          <Tabell
            data={tabellData}
            columns={kolumner}
            getRowId={(row) => (row.isTransaction ? `${row.kontonummer}-trans-${row.id}` : row.id)}
          />
        </AnimeradFlik>
      );
    });
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
      doc.text(företagsnamn || "ANGBERG, ROBERT", 14, 30);
      doc.text(organisationsnummer || "8306186910", 14, 36);

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
        <h2 className="text-xl font-semibold mt-16 mb-4 text-center">Rörelsens intäkter</h2>
        {renderGrupper(data.intakter, true, "💰")}
        <Totalrad
          label="Summa rörelsens intäkter"
          values={{
            [`Ing. balans\n${previousYear}-01-01`]: intaktsSum[previousYear] ?? 0,
            Resultat: intaktsSum[currentYear] ?? 0,
            [`Utg. balans\n${currentYear}-12-31`]:
              (intaktsSum[previousYear] ?? 0) + (intaktsSum[currentYear] ?? 0),
          }}
        />

        {/* Rörelsens kostnader */}
        <h2 className="text-xl font-semibold mt-10 mb-4 text-center">Rörelsens kostnader</h2>
        {renderGrupper(data.rorelsensKostnader, false, "💸")}
        <div className="mb-10">
          <Totalrad
            label="Summa rörelsens kostnader"
            values={{
              [`Ing. balans\n${previousYear}-01-01`]: -rorelsensSum[previousYear] || 0,
              Resultat: -rorelsensSum[currentYear] || 0,
              [`Utg. balans\n${currentYear}-12-31`]:
                (-rorelsensSum[previousYear] || 0) + (-rorelsensSum[currentYear] || 0),
            }}
          />
        </div>

        {/* Finansiella intäkter */}
        {data.finansiellaIntakter && data.finansiellaIntakter.length > 0 && (
          <>
            <h2 className="text-xl font-semibold mt-10 mb-4">Finansiella intäkter</h2>
            {renderGrupper(data.finansiellaIntakter, false, "💰")}
            <Totalrad
              label="Summa finansiella intäkter"
              values={{
                [`Ing. balans\n${previousYear}-01-01`]: finansiellaIntakterSum[previousYear] ?? 0,
                Resultat: finansiellaIntakterSum[currentYear] ?? 0,
                [`Utg. balans\n${currentYear}-12-31`]:
                  (finansiellaIntakterSum[previousYear] ?? 0) +
                  (finansiellaIntakterSum[currentYear] ?? 0),
              }}
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
              values={{
                [`Ing. balans\n${previousYear}-01-01`]: finansiellaKostnaderSum[previousYear] ?? 0,
                Resultat: finansiellaKostnaderSum[currentYear] ?? 0,
                [`Utg. balans\n${currentYear}-12-31`]:
                  (finansiellaKostnaderSum[previousYear] ?? 0) +
                  (finansiellaKostnaderSum[currentYear] ?? 0),
              }}
            />
          </>
        )}
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
        {loadingModal ? (
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

      {/* Slutsummor */}
      <div className="mx-auto px-4 text-white">
        <h2 className="text-xl font-semibold mt-12 mb-4 text-center">Resultat</h2>
        <AnimeradFlik title="Resultat" icon="📊">
          <Tabell
            columns={[
              {
                key: "beskrivning",
                label: "Konto",
                render: (_, row) => <div className="font-medium">{row.beskrivning}</div>,
              },
              {
                key: "ingBalans",
                label: `Ing. balans\n${previousYear}-01-01`,
                className: "text-right whitespace-pre-line",
                render: (_, row) => formatSEK(row.ingBalans),
              },
              {
                key: "resultat",
                label: "Resultat",
                className: "text-right",
                render: (_, row) => formatSEK(row.resultat),
              },
              {
                key: "utgBalans",
                label: `Utg. balans\n${currentYear}-12-31`,
                className: "text-right whitespace-pre-line",
                render: (_, row) => formatSEK(row.utgBalans),
              },
            ]}
            data={[
              {
                id: "rorelsens-resultat",
                beskrivning: "Rörelsens resultat",
                ingBalans: rorelsensResultat[previousYear] ?? 0,
                resultat: rorelsensResultat[currentYear] ?? 0,
                utgBalans:
                  (rorelsensResultat[previousYear] ?? 0) + (rorelsensResultat[currentYear] ?? 0),
              },
              ...(data.finansiellaIntakter && data.finansiellaIntakter.length > 0
                ? [
                    {
                      id: "finansiella-intakter",
                      beskrivning: "Finansiella intäkter",
                      ingBalans: finansiellaIntakterSum[previousYear] ?? 0,
                      resultat: finansiellaIntakterSum[currentYear] ?? 0,
                      utgBalans:
                        (finansiellaIntakterSum[previousYear] ?? 0) +
                        (finansiellaIntakterSum[currentYear] ?? 0),
                    },
                  ]
                : []),
              ...(data.finansiellaKostnader && data.finansiellaKostnader.length > 0
                ? [
                    {
                      id: "finansiella-kostnader",
                      beskrivning: "Finansiella kostnader",
                      ingBalans: finansiellaKostnaderSum[previousYear] ?? 0,
                      resultat: finansiellaKostnaderSum[currentYear] ?? 0,
                      utgBalans:
                        (finansiellaKostnaderSum[previousYear] ?? 0) +
                        (finansiellaKostnaderSum[currentYear] ?? 0),
                    },
                  ]
                : []),
              {
                id: "resultat-efter-finansiella",
                beskrivning: "Resultat efter finansiella poster",
                ingBalans: resultatEfterFinansiella[previousYear] ?? 0,
                resultat: resultatEfterFinansiella[currentYear] ?? 0,
                utgBalans:
                  (resultatEfterFinansiella[previousYear] ?? 0) +
                  (resultatEfterFinansiella[currentYear] ?? 0),
              },
              {
                id: "beraknat-resultat",
                beskrivning: "Beräknat resultat",
                ingBalans: resultat[previousYear] ?? 0,
                resultat: resultat[currentYear] ?? 0,
                utgBalans: (resultat[previousYear] ?? 0) + (resultat[currentYear] ?? 0),
              },
            ]}
            getRowId={(row) => row.id}
          />
        </AnimeradFlik>

        <Totalrad
          label="Beräknat resultat"
          values={{
            [`Ing. balans\n${previousYear}-01-01`]: resultat[previousYear] ?? 0,
            Resultat: resultat[currentYear] ?? 0,
            [`Utg. balans\n${currentYear}-12-31`]:
              (resultat[previousYear] ?? 0) + (resultat[currentYear] ?? 0),
          }}
        />
      </div>

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
