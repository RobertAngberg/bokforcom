// #region
"use client";

import React, { useState } from "react";
import MainLayout from "../../_components/MainLayout";
import AnimeradFlik from "../../_components/AnimeradFlik";
import Knapp from "../../_components/Knapp";
import VerifikatModal from "../../_components/VerifikatModal";
import Tabell, { ColumnDefinition } from "../../_components/Tabell";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

type Props = {
  initialData: BalansData;
  företagsnamn?: string;
  organisationsnummer?: string;
};
// #endregion

export default function Balansrapport({ initialData, företagsnamn, organisationsnummer }: Props) {
  //#region State & Variables
  const [verifikatId, setVerifikatId] = useState<number | null>(null);
  const [expandedKonto, setExpandedKonto] = useState<string | null>(null);
  //#endregion

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
  };

  const handleExportCSV = () => {
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
  };
  //#region Render Functions - Snygg AnimeradFlik layout
  // ENKEL render funktion med din Tabell komponent + Bokio-stil summering + transaktioner!
  const renderaKategoriMedKolumner = (titel: string, icon: string, konton: Konto[]) => {
    const summa = konton.reduce((a, b) => a + b.utgaendeSaldo, 0);

    const kolumner: ColumnDefinition<Konto>[] = [
      {
        key: "beskrivning",
        label: "Konto",
        render: (_, konto) => `${konto.kontonummer} – ${konto.beskrivning}`,
      },
      {
        key: "ingaendeSaldo",
        label: `Ing. balans ${year}-01-01`,
        render: (_, konto) => formatSEK(konto.ingaendeSaldo),
      },
      {
        key: "aretsResultat",
        label: "Resultat",
        render: (_, konto) => formatSEK(konto.aretsResultat),
      },
      {
        key: "utgaendeSaldo",
        label: `Utg. balans ${year}-12-31`,
        render: (_, konto) => formatSEK(konto.utgaendeSaldo),
      },
    ];

    // Funktion för att rendera transaktioner som Bokio - FIXAD!
    const renderTransaktioner = (konto: Konto) => {
      if (!konto.transaktioner || konto.transaktioner.length === 0) {
        return (
          <tr>
            <td colSpan={4} className="px-6 py-2 text-gray-400 text-sm italic">
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
                className={`${
                  index % 2 === 0 ? "bg-gray-800" : "bg-gray-900"
                } hover:bg-gray-700 cursor-pointer`}
                onClick={() =>
                  transaktion.transaktion_id && setVerifikatId(transaktion.transaktion_id)
                }
              >
                <td className="px-6 py-2 text-blue-400 text-sm">{vNumber}</td>
                <td className="px-6 py-2 text-gray-300 text-sm" colSpan={2}>
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

    // Lägg till summeringsrad som Bokio - EXAKT som de har det!
    const kontonMedSummering = [...konton];
    kontonMedSummering.push({
      kontonummer: "",
      beskrivning: `Summa ${titel.toLowerCase()}`,
      ingaendeSaldo: konton.reduce((sum, k) => sum + k.ingaendeSaldo, 0),
      aretsResultat: konton.reduce((sum, k) => sum + k.aretsResultat, 0),
      utgaendeSaldo: summa,
      transaktioner: [],
    } as Konto);

    return (
      <AnimeradFlik title={titel} icon={icon} visaSummaDirekt={formatSEK(summa)} forcedOpen={true}>
        <Tabell
          data={kontonMedSummering}
          columns={kolumner}
          getRowId={(konto) => konto.kontonummer || "SUMMA"}
          activeId={expandedKonto}
          handleRowClick={(id) => setExpandedKonto(expandedKonto === id ? null : String(id))}
          renderExpandedRow={renderTransaktioner}
          isRowClickable={(konto) => konto.kontonummer !== ""}
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

    const kolumner: ColumnDefinition<Konto>[] = [
      {
        key: "beskrivning",
        label: "Konto",
        render: (_, konto) => `${konto.kontonummer} – ${konto.beskrivning}`,
      },
      {
        key: "ingaendeSaldo",
        label: `Ing. balans ${year}-01-01`,
        render: (_, konto) => formatSEK(konto.ingaendeSaldo),
      },
      {
        key: "aretsResultat",
        label: "Resultat",
        render: (_, konto) => formatSEK(konto.aretsResultat),
      },
      {
        key: "utgaendeSaldo",
        label: `Utg. balans ${year}-12-31`,
        render: (_, konto) => formatSEK(konto.utgaendeSaldo),
      },
    ];

    // Lägg till summeringsrad som inkluderar beräknat resultat!
    const kontonMedSummering = [...konton];
    kontonMedSummering.push({
      kontonummer: "",
      beskrivning: `Summa ${titel.toLowerCase()}`,
      ingaendeSaldo:
        konton.reduce((sum, k) => sum + k.ingaendeSaldo, 0) + beraknatResultatData.ingaende,
      aretsResultat:
        konton.reduce((sum, k) => sum + k.aretsResultat, 0) + beraknatResultatData.arets,
      utgaendeSaldo: totalSumma,
      transaktioner: [],
    } as Konto);

    return (
      <AnimeradFlik
        title={titel}
        icon={icon}
        visaSummaDirekt={formatSEK(totalSumma)}
        forcedOpen={true}
      >
        <Tabell
          data={kontonMedSummering}
          columns={kolumner}
          getRowId={(konto) => konto.kontonummer || "SUMMA"}
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
    const kolumner: ColumnDefinition<Konto>[] = [
      {
        key: "beskrivning",
        label: "Konto",
        render: (_, konto) => `${konto.kontonummer} – ${konto.beskrivning}`,
      },
      {
        key: "ingaendeSaldo",
        label: `Ing. balans ${year}-01-01`,
        render: (_, konto) => formatSEK(konto.ingaendeSaldo),
      },
      {
        key: "aretsResultat",
        label: "Resultat",
        render: (_, konto) => formatSEK(konto.aretsResultat),
      },
      {
        key: "utgaendeSaldo",
        label: `Utg. balans ${year}-12-31`,
        render: (_, konto) => formatSEK(konto.utgaendeSaldo),
      },
    ];

    // Skapa fake konto för beräknat resultat
    const beraknatResultatKonto: Konto = {
      kontonummer: "",
      beskrivning: "Beräknat resultat",
      ingaendeSaldo: beraknatResultatData.ingaende,
      aretsResultat: beraknatResultatData.arets,
      utgaendeSaldo: beraknatResultatData.utgaende,
      transaktioner: [],
    };

    return (
      <AnimeradFlik
        title="Beräknat resultat"
        icon="📊"
        visaSummaDirekt={formatSEK(beraknatResultatData.utgaende)}
        forcedOpen={true}
      >
        <Tabell
          data={[beraknatResultatKonto]}
          columns={kolumner}
          getRowId={(konto) => "BERAKNAT"}
        />
      </AnimeradFlik>
    );
  };
  //#endregion

  //#region Data Filtering - Dynamisk kategorisering baserat på svensk kontoplan
  const anläggningstillgångar = tillgangar.filter((k) => /^1[0-5]/.test(k.kontonummer));
  const omsättningstillgångar = tillgangar.filter((k) => /^1[6-9]/.test(k.kontonummer));

  const egetKapital = skulderOchEgetKapital.filter((k) => /^20/.test(k.kontonummer));
  const avsättningar = skulderOchEgetKapital.filter((k) => /^21/.test(k.kontonummer));
  const långfristigaSkulder = skulderOchEgetKapital.filter((k) => /^2[2-3]/.test(k.kontonummer));
  const kortfristigaSkulder = skulderOchEgetKapital.filter((k) => /^2[4-9]/.test(k.kontonummer));
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

      <div className="flex mt-8 gap-4 justify-end">
        <Knapp text="Ladda ner PDF" onClick={handleExportPDF} />
        <Knapp text="Ladda ner CSV" onClick={handleExportCSV} />
      </div>
    </MainLayout>
  );
}
