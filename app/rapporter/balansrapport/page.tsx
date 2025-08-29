"use client";

import React, { useState, useEffect } from "react";
import MainLayout from "../../_components/MainLayout";
import AnimeradFlik from "../../_components/AnimeradFlik";
import Knapp from "../../_components/Knapp";
import VerifikatModal from "../../_components/VerifikatModal";
import Modal from "../../_components/Modal";
import Tabell, { ColumnDefinition } from "../../_components/Tabell";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { fetchBalansData, fetchFöretagsprofil } from "./actions";

type Transaktion = {
  id: string;
  datum: string | Date;
  belopp: number;
  beskrivning?: string;
  transaktion_id?: number;
  verifikatNummer?: string;
};

type Konto = {
  kontonummer: string;
  beskrivning: string;
  ingaendeSaldo: number;
  aretsResultat: number;
  utgaendeSaldo: number;
  transaktioner: Transaktion[];
};

type BalansData = {
  year: string;
  tillgangar: Konto[];
  skulderOchEgetKapital: Konto[];
};

export default function Page() {
  //#region State & Variables
  const [initialData, setInitialData] = useState<BalansData | null>(null);
  const [företagsnamn, setFöretagsnamn] = useState<string>("");
  const [organisationsnummer, setOrganisationsnummer] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [verifikatId, setVerifikatId] = useState<number | null>(null);
  const [expandedKonto, setExpandedKonto] = useState<string | null>(null);

  // State för verifikatmodal
  const [showModal, setShowModal] = useState(false);
  const [selectedKonto, setSelectedKonto] = useState("");
  const [verifikationer, setVerifikationer] = useState<any[]>([]);
  const [loadingModal, setLoadingModal] = useState(false);

  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [exportMessage, setExportMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  //#endregion

  // Ladda data när komponenten mountas
  useEffect(() => {
    const loadData = async () => {
      try {
        const year = new Date().getFullYear().toString();
        const [balansData, profilData] = await Promise.all([
          fetchBalansData(year),
          fetchFöretagsprofil(),
        ]);

        setInitialData(balansData);
        setFöretagsnamn(profilData?.företagsnamn ?? "");
        setOrganisationsnummer(profilData?.organisationsnummer ?? "");
      } catch (error) {
        console.error("Fel vid laddning av balansdata:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Om data fortfarande laddas
  if (loading || !initialData) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-white">Laddar balansrapport...</div>
        </div>
      </MainLayout>
    );
  }

  //#region Business Logic - Bokio-kompatibel beräkning
  // Hitta och extrahera beräknat resultat från skulderOchEgetKapital
  const beraknatResultatKonto = initialData.skulderOchEgetKapital.find(
    (k) => k.kontonummer === "9999"
  );
  const beraknatResultatData = beraknatResultatKonto
    ? {
        ingaende: beraknatResultatKonto.ingaendeSaldo,
        arets: beraknatResultatKonto.aretsResultat,
        utgaende: beraknatResultatKonto.utgaendeSaldo,
      }
    : { ingaende: 0, arets: 0, utgaende: 0 };

  // Ta bort beräknat resultat från den vanliga listan
  const skulderOchEgetKapitalUtanBeraknat = initialData.skulderOchEgetKapital.filter(
    (k) => k.kontonummer !== "9999"
  );

  const processedData = {
    ...initialData,
    tillgangar: initialData.tillgangar.map((konto) => ({
      ...konto,
      // Använd beskrivningarna exakt som Bokio
      beskrivning: konto.kontonummer === "1930" ? "Företagskonto / affärskonto" : konto.beskrivning,
    })),
    skulderOchEgetKapital: skulderOchEgetKapitalUtanBeraknat,
  };

  // Beräknat resultat ska läggas till eget kapital, inte visa som egen kategori
  const beraknatResultatVarde = beraknatResultatData.utgaende;
  //#endregion

  //#region Helper Functions
  // Formatering för SEK utan decimaler - som Bokio!
  const formatSEK = (val: number) => {
    // Avrunda till heltal först för att ta bort decimaler
    const rundatVarde = Math.round(val);

    const formatted = rundatVarde
      .toLocaleString("sv-SE", {
        style: "currency",
        currency: "SEK",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
      .replace(/[^0-9a-zA-Z,.\-\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    // Behåll minustecknet för negativa värden
    return rundatVarde < 0 && !formatted.startsWith("-") ? `-${formatted}` : formatted;
  };

  // Formatera datum för transaktioner
  const formatDaterat = (datum: string | Date) => {
    if (typeof datum === "string") {
      // Ta bort T00:00:00 delen
      return datum.split("T")[0];
    }
    return new Date(datum).toLocaleDateString("sv-SE");
  };

  function skapaBalansSammanställning(data: BalansData) {
    const { year, tillgangar, skulderOchEgetKapital } = data;

    const sumKonton = (konton: Konto[]) =>
      konton.reduce((sum, konto) => sum + (konto.utgaendeSaldo ?? 0), 0);

    const sumTillgangar = sumKonton(tillgangar);
    const sumSkulderEKUtan = sumKonton(skulderOchEgetKapital);

    // Lägg till beräknat resultat för att balansera (men använd det riktiga värdet)
    const sumSkulderEK = sumSkulderEKUtan + beraknatResultatVarde;

    return {
      year,
      tillgangar,
      skulderOchEgetKapital,
      sumTillgangar,
      sumSkulderEK,
      beraknatResultat: beraknatResultatVarde, // Använd det riktiga värdet
    };
  }

  const { year, tillgangar, skulderOchEgetKapital, sumTillgangar, sumSkulderEK, beraknatResultat } =
    skapaBalansSammanställning(processedData);
  //#endregion

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

  //#region Export Functions
  const handleExportPDF = async () => {
    if (isExportingPDF) return;

    setIsExportingPDF(true);
    setExportMessage(null);

    try {
      // Validera data
      if (!processedData.tillgangar.length && !processedData.skulderOchEgetKapital.length) {
        throw new Error("Ingen data att exportera");
      }

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Header
      let y = 30;
      doc.setFontSize(32);
      doc.text("Balansrapport", 105, y, { align: "center" });

      // Margin bottom under rubrik
      y += 22;

      // Företagsnamn (bold)
      if (företagsnamn) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(företagsnamn, 14, y);
        y += 7;
      }

      // Organisationsnummer (normal)
      if (organisationsnummer) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text(organisationsnummer, 14, y);
        y += 8;
      }

      // Utskriven datum
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Utskriven: ${new Date().toISOString().slice(0, 10)}`, 14, y);

      y += 18;

      // Dynamiska grupper
      const grupper = [
        { titel: "Tillgångar", konton: tillgangar },
        { titel: "Eget kapital och skulder", konton: skulderOchEgetKapital },
      ];

      grupper.forEach(({ titel, konton }) => {
        doc.setFontSize(15);
        doc.setFont("helvetica", "bold");
        doc.text(titel, 14, y);
        y += 8;

        // Tabellrader
        const rows: any[][] = konton.map((konto) => [
          konto.kontonummer,
          konto.beskrivning,
          formatSEK(konto.utgaendeSaldo),
        ]);

        // Summeringsrad med colSpan
        const summa = konton.reduce((sum, k) => sum + (k.utgaendeSaldo ?? 0), 0);
        rows.push([
          { content: `Summa ${titel.toLowerCase()}`, colSpan: 2, styles: { fontStyle: "bold" } },
          { content: formatSEK(summa), styles: { fontStyle: "bold", halign: "left" } },
        ]);

        autoTable(doc, {
          startY: y,
          head: [["Konto", "Beskrivning", "Saldo"]],
          body: rows,
          theme: "plain",
          styles: { fontSize: 12, textColor: "#111", halign: "left" },
          headStyles: { fontStyle: "bold", textColor: "#111" },
          margin: { left: 14, right: 14 },
          columnStyles: {
            0: { cellWidth: 32 },
            1: { cellWidth: 110 },
            2: { cellWidth: 34 },
          },
          didDrawPage: (data) => {
            if (data.cursor) y = data.cursor.y + 8;
          },
        });

        y += 4;
      });

      // Balanskontroll
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 128, 0);
      doc.text("Balanskontroll", 14, y);
      if (beraknatResultat !== 0) {
        y += 7;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(150, 150, 0);
        doc.text(`Beräknat resultat: ${formatSEK(beraknatResultat)} ingår i eget kapital`, 14, y);
      }
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");

      doc.save("balansrapport.pdf");
      setExportMessage({ type: "success", text: "PDF-rapporten har laddats ner" });
    } catch (error) {
      console.error("PDF Export error:", error);
      setExportMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Ett fel uppstod vid PDF-exporten",
      });
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportCSV = async () => {
    if (isExportingCSV) return;

    setIsExportingCSV(true);
    setExportMessage(null);

    try {
      // Validera data
      if (!processedData.tillgangar.length && !processedData.skulderOchEgetKapital.length) {
        throw new Error("Ingen data att exportera");
      }

      let csv = `Balansrapport ${year}\n\n`;
      csv += "Tillgångar\nKonto;Beskrivning;Saldo\n";
      tillgangar.forEach((konto) => {
        csv +=
          [konto.kontonummer, `"${konto.beskrivning}"`, formatSEK(konto.utgaendeSaldo)].join(";") +
          "\n";
      });
      csv += `;Summa tillgångar;${formatSEK(sumTillgangar)}\n\n`;

      csv += "Eget kapital och skulder\nKonto;Beskrivning;Saldo\n";
      skulderOchEgetKapital.forEach((konto) => {
        csv +=
          [konto.kontonummer, `"${konto.beskrivning}"`, formatSEK(konto.utgaendeSaldo)].join(";") +
          "\n";
      });
      csv += `;Summa eget kapital och skulder;${formatSEK(sumSkulderEK)}\n\n`;

      csv += "Balanskontroll\n";
      if (beraknatResultat !== 0) {
        csv += `Beräknat resultat;${formatSEK(beraknatResultat)}\n`;
      }

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "balansrapport.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportMessage({ type: "success", text: "CSV-filen har laddats ner" });
    } catch (error) {
      console.error("CSV Export error:", error);
      setExportMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Ett fel uppstod vid CSV-exporten",
      });
    } finally {
      setIsExportingCSV(false);
    }
  };
  //#region Render Functions - Snygg AnimeradFlik layout

  // Gemensam funktion för att rendera transaktioner som Bokio
  const renderTransaktioner = (konto: Konto) => {
    if (!konto.transaktioner || konto.transaktioner.length === 0) {
      return (
        <tr>
          <td colSpan={5} className="px-6 py-2 text-gray-400 text-sm italic">
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
              // Ta bort T00:00:00 delen
              return datum.split("T")[0];
            }
            return new Date(datum).toLocaleDateString("sv-SE");
          };

          // Extrahera korrekt V-nummer - använd beskrivning först
          const extractVNumber = () => {
            // 1. Först kolla efter V:nummer i beskrivning: "Verifikation V:1" -> "V1"
            if (transaktion.beskrivning && transaktion.beskrivning.includes("V:")) {
              const match = transaktion.beskrivning.match(/V:(\d+)/);
              if (match) {
                return `V${match[1]}`;
              }
            }

            // 2. Leta efter bara V-nummer i beskrivning: "V123"
            if (transaktion.beskrivning) {
              const match = transaktion.beskrivning.match(/V(\d+)/);
              if (match) {
                return `V${match[1]}`;
              }
            }

            // 3. Fallback till verifikatNummer om inget annat fungerar
            return transaktion.verifikatNummer || "V-";
          };

          const vNumber = extractVNumber();

          return (
            <tr
              key={index}
              className="bg-gray-800 hover:bg-gray-700 cursor-pointer"
              onClick={() =>
                transaktion.transaktion_id && setVerifikatId(transaktion.transaktion_id)
              }
            >
              <td className="px-6 py-2 text-blue-400 text-sm">{vNumber}</td>
              <td className="px-6 py-2 text-gray-300 text-sm" colSpan={3}>
                {formatDaterat(transaktion.datum)} {transaktion.beskrivning || "Transaktion"}
              </td>
              <td className="px-6 py-2 text-gray-300 text-sm text-right">
                {formatSEK(transaktion.belopp)}
              </td>
            </tr>
          );
        })}
      </>
    );
  };

  // BOKIO-STIL render funktion med AnimeradFlik och Tabell - visar alla transaktioner som separata rader!
  const renderaKategoriMedKolumner = (titel: string, icon: string, konton: Konto[]) => {
    const summa = konton.reduce((a, b) => a + b.utgaendeSaldo, 0);

    const kolumner: ColumnDefinition<any>[] = [
      {
        key: "beskrivning",
        label: "Konto",
        render: (_, row) => {
          if (row.isTransaction) {
            // Transaktionsrad - visa bara ID-numret, inget annat
            return (
              <div
                className="ml-4 text-sm text-blue-400 hover:text-blue-300 cursor-pointer"
                onClick={() => row.transaktion_id && setVerifikatId(row.transaktion_id)}
              >
                {row.id}
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
        key: "ingaendeSaldo",
        label: `Ing. balans ${year}-01-01`,
        render: (_, row) => {
          if (row.isTransaction) return "";
          return formatSEK(row.ingaendeSaldo || 0);
        },
      },
      {
        key: "aretsResultat",
        label: "Resultat",
        render: (_, row) => {
          if (row.isTransaction) {
            // Transaktionsbelopp ska vara under Resultat, inte Utg. balans
            // För vissa konton (moms konton) ska tecknet reverseras för att matcha Bokio
            let belopp = row.belopp;
            if (
              row.kontonummer &&
              (row.kontonummer.startsWith("26") || row.kontonummer.startsWith("264"))
            ) {
              // Moms konton ska visa negativa belopp för utgående moms
              belopp = -Math.abs(belopp);
            }
            return <div className="text-right">{formatSEK(belopp)}</div>;
          }
          return formatSEK(row.aretsResultat || 0);
        },
      },
      {
        key: "utgaendeSaldo",
        label: `Utg. balans ${year}-12-31`,
        render: (_, row) => {
          if (row.isTransaction) return "";
          const className = row.isSummary ? "font-bold" : "";
          return (
            <div className={`text-right ${className}`}>{formatSEK(row.utgaendeSaldo || 0)}</div>
          );
        },
      },
    ];

    // Expandera konton till tabellrader med alla transaktioner
    const tabellData: any[] = [];

    konton.forEach((konto) => {
      // Lägg till kontorad
      tabellData.push({
        id: konto.kontonummer,
        kontonummer: konto.kontonummer,
        beskrivning: konto.beskrivning,
        ingaendeSaldo: konto.ingaendeSaldo,
        aretsResultat: konto.aretsResultat,
        utgaendeSaldo: konto.utgaendeSaldo,
        isTransaction: false,
        isSummary: false,
      });

      // Lägg till alla transaktioner som separata rader
      if (konto.transaktioner && konto.transaktioner.length > 0) {
        konto.transaktioner.forEach((transaktion, index) => {
          tabellData.push({
            id: transaktion.id, // Använd transaktionens riktiga ID
            datum: transaktion.datum,
            beskrivning: transaktion.beskrivning,
            belopp: transaktion.belopp,
            verifikatNummer: transaktion.verifikatNummer,
            transaktion_id: transaktion.transaktion_id,
            kontonummer: konto.kontonummer, // Lägg till kontonummer för unika keys
            isTransaction: true,
            isSummary: false,
          });
        });
      }
    });

    // Lägg till summeringsrad
    tabellData.push({
      id: "SUMMA",
      beskrivning: `Summa ${titel.toLowerCase()}`,
      ingaendeSaldo: konton.reduce((sum, k) => sum + k.ingaendeSaldo, 0),
      aretsResultat: konton.reduce((sum, k) => sum + k.aretsResultat, 0),
      utgaendeSaldo: summa,
      isTransaction: false,
      isSummary: true,
    });

    return (
      <AnimeradFlik title={titel} icon={icon} visaSummaDirekt={formatSEK(summa)}>
        <Tabell
          data={tabellData}
          columns={kolumner}
          getRowId={(row) => (row.isTransaction ? `${row.kontonummer}-trans-${row.id}` : row.id)}
        />
      </AnimeradFlik>
    );
  };

  // Speciell funktion för Eget kapital och skulder som inkluderar beräknat resultat
  const renderaEgetKapitalMedBeraknatResultat = (
    titel: string,
    icon: string,
    konton: Konto[],
    beraknatResultatVarde: number,
    beraknatResultatData: { ingaende: number; arets: number; utgaende: number }
  ) => {
    const kontonSumma = konton.reduce((a, b) => a + b.utgaendeSaldo, 0);
    const totalSumma = kontonSumma + beraknatResultatVarde;

    const kolumner: ColumnDefinition<any>[] = [
      {
        key: "beskrivning",
        label: "Konto",
        render: (_, row) => {
          if (row.isTransaction) {
            // Transaktionsrad - visa bara ID-numret, inget annat
            return (
              <div
                className="ml-4 text-sm text-blue-400 hover:text-blue-300 cursor-pointer"
                onClick={() => row.transaktion_id && setVerifikatId(row.transaktion_id)}
              >
                {row.id}
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
        key: "ingaendeSaldo",
        label: `Ing. balans ${year}-01-01`,
        render: (_, row) => {
          if (row.isTransaction) return "";
          return formatSEK(row.ingaendeSaldo || 0);
        },
      },
      {
        key: "aretsResultat",
        label: "Resultat",
        render: (_, row) => {
          if (row.isTransaction) {
            // Transaktionsbelopp ska vara under Resultat, inte Utg. balans
            // För vissa konton (moms konton) ska tecknet reverseras för att matcha Bokio
            let belopp = row.belopp;
            if (
              row.kontonummer &&
              (row.kontonummer.startsWith("26") || row.kontonummer.startsWith("264"))
            ) {
              // Moms konton ska visa negativa belopp för utgående moms
              belopp = -Math.abs(belopp);
            }
            return <div className="text-right">{formatSEK(belopp)}</div>;
          }
          return formatSEK(row.aretsResultat || 0);
        },
      },
      {
        key: "utgaendeSaldo",
        label: `Utg. balans ${year}-12-31`,
        render: (_, row) => {
          if (row.isTransaction) return "";
          const className = row.isSummary ? "font-bold" : "";
          return (
            <div className={`text-right ${className}`}>{formatSEK(row.utgaendeSaldo || 0)}</div>
          );
        },
      },
    ];

    // Expandera konton till tabellrader med alla transaktioner
    const tabellData: any[] = [];

    konton.forEach((konto) => {
      // Lägg till kontorad
      tabellData.push({
        id: konto.kontonummer,
        kontonummer: konto.kontonummer,
        beskrivning: konto.beskrivning,
        ingaendeSaldo: konto.ingaendeSaldo,
        aretsResultat: konto.aretsResultat,
        utgaendeSaldo: konto.utgaendeSaldo,
        isTransaction: false,
        isSummary: false,
      });

      // Lägg till alla transaktioner som separata rader
      if (konto.transaktioner && konto.transaktioner.length > 0) {
        konto.transaktioner.forEach((transaktion, index) => {
          tabellData.push({
            id: transaktion.id, // Använd transaktionens riktiga ID
            datum: transaktion.datum,
            beskrivning: transaktion.beskrivning,
            belopp: transaktion.belopp,
            verifikatNummer: transaktion.verifikatNummer,
            transaktion_id: transaktion.transaktion_id,
            kontonummer: konto.kontonummer, // Lägg till kontonummer för unika keys
            isTransaction: true,
            isSummary: false,
          });
        });
      }
    });

    // Lägg till summeringsrad som inkluderar beräknat resultat
    tabellData.push({
      id: "SUMMA",
      beskrivning: `Summa ${titel.toLowerCase()}`,
      ingaendeSaldo:
        konton.reduce((sum, k) => sum + k.ingaendeSaldo, 0) + beraknatResultatData.ingaende,
      aretsResultat:
        konton.reduce((sum, k) => sum + k.aretsResultat, 0) + beraknatResultatData.arets,
      utgaendeSaldo: totalSumma,
      isTransaction: false,
      isSummary: true,
    });

    return (
      <AnimeradFlik title={titel} icon={icon} visaSummaDirekt={formatSEK(totalSumma)}>
        <Tabell
          data={tabellData}
          columns={kolumner}
          getRowId={(row) => (row.isTransaction ? `${row.kontonummer}-trans-${row.id}` : row.id)}
        />
      </AnimeradFlik>
    );
  };

  // Speciell funktion för Beräknat resultat - precis som Bokio!
  const renderaBeraknatResultat = (beraknatResultatData: {
    ingaende: number;
    arets: number;
    utgaende: number;
  }) => {
    const kolumner: ColumnDefinition<any>[] = [
      {
        key: "beskrivning",
        label: "Konto",
        render: (_, row) => <div className="font-medium">– {row.beskrivning}</div>,
      },
      {
        key: "ingaendeSaldo",
        label: `Ing. balans ${year}-01-01`,
        render: (_, row) => formatSEK(row.ingaendeSaldo || 0),
      },
      {
        key: "aretsResultat",
        label: "Resultat",
        render: (_, row) => formatSEK(row.aretsResultat || 0),
      },
      {
        key: "utgaendeSaldo",
        label: `Utg. balans ${year}-12-31`,
        render: (_, row) => formatSEK(row.utgaendeSaldo || 0),
      },
    ];

    // Skapa tabelldata för beräknat resultat
    const tabellData = [
      {
        id: "beraknat-resultat",
        beskrivning: "Beräknat resultat",
        ingaendeSaldo: beraknatResultatData.ingaende,
        aretsResultat: beraknatResultatData.arets,
        utgaendeSaldo: beraknatResultatData.utgaende,
      },
    ];

    return (
      <AnimeradFlik
        title="Beräknat resultat"
        icon="📊"
        visaSummaDirekt={formatSEK(beraknatResultatData.utgaende)}
      >
        <Tabell data={tabellData} columns={kolumner} getRowId={(row) => row.id} />
      </AnimeradFlik>
    );
  };
  //#endregion

  //#region Data Filtering - Dynamisk kategorisering baserat på svensk kontoplan
  const anläggningstillgångar = processedData.tillgangar.filter((k) =>
    /^1[0-5]/.test(k.kontonummer)
  );
  const omsättningstillgångar = processedData.tillgangar.filter((k) =>
    /^1[6-9]/.test(k.kontonummer)
  );

  const egetKapital = processedData.skulderOchEgetKapital.filter((k) => /^20/.test(k.kontonummer));
  const avsättningar = processedData.skulderOchEgetKapital.filter((k) => /^21/.test(k.kontonummer));
  const långfristigaSkulder = processedData.skulderOchEgetKapital.filter((k) =>
    /^2[2-3]/.test(k.kontonummer)
  );
  const kortfristigaSkulder = processedData.skulderOchEgetKapital.filter((k) =>
    /^2[4-9]/.test(k.kontonummer)
  );
  //#endregion

  return (
    <MainLayout>
      <div className="mx-auto px-4 text-white">
        <h1 className="text-3xl text-center mb-8">Balansrapport</h1>

        {/* BOKIO-STIL KATEGORISERING! */}
        {renderaKategoriMedKolumner("Tillgångar", "💼", [
          ...anläggningstillgångar,
          ...omsättningstillgångar,
        ])}

        {/* EGET KAPITAL - Bara 20xx konton */}
        {renderaKategoriMedKolumner("Eget kapital", "🏛️", egetKapital)}

        {/* BERÄKNAT RESULTAT - Egen sektion som Bokio */}
        {renderaBeraknatResultat(beraknatResultatData)}

        {/* SKULDER - Långfristiga + Kortfristiga */}
        {renderaKategoriMedKolumner("Skulder", "💳", [
          ...långfristigaSkulder,
          ...kortfristigaSkulder,
        ])}
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

      {exportMessage && (
        <div
          className={`mb-4 p-3 rounded ${
            exportMessage.type === "success"
              ? "bg-green-100 border border-green-400 text-green-700"
              : "bg-red-100 border border-red-400 text-red-700"
          }`}
        >
          <strong className="font-bold">
            {exportMessage.type === "success" ? "Klar!" : "Fel:"}
          </strong>
          <span className="block sm:inline"> {exportMessage.text}</span>
        </div>
      )}

      <div className="flex mt-8 gap-4 justify-end">
        <Knapp
          text={isExportingPDF ? "Skapar PDF..." : "Ladda ner PDF"}
          onClick={handleExportPDF}
          disabled={isExportingPDF || isExportingCSV}
        />
        <Knapp
          text={isExportingCSV ? "Skapar CSV..." : "Ladda ner CSV"}
          onClick={handleExportCSV}
          disabled={isExportingPDF || isExportingCSV}
        />
      </div>
    </MainLayout>
  );
}
