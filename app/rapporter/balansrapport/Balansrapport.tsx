// #region
"use client";

import React, { useState } from "react";
import MainLayout from "../../_components/MainLayout";
import AnimeradFlik from "../../_components/AnimeradFlik";
import Knapp from "../../_components/Knapp";
import VerifikatModal from "../../_components/VerifikatModal";
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
  // Formatering för SEK med behållet minustecken
  const formatSEK = (val: number) => {
    const formatted = val
      .toLocaleString("sv-SE", { style: "currency", currency: "SEK" })
      .replace(/[^0-9a-zA-Z,.\-\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    // Behåll minustecknet för negativa värden
    return val < 0 && !formatted.startsWith("-") ? `-${formatted}` : formatted;
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
  // Snygg kategori-rendering med AnimeradFlik
  const renderaKategoriMedKolumner = (titel: string, icon: string, konton: Konto[]) => {
    const summa = konton.reduce((a, b) => a + b.utgaendeSaldo, 0);

    if (konton.length === 0) {
      return (
        <AnimeradFlik title={titel} icon={icon} visaSummaDirekt="0 kr" forcedOpen={true}>
          <div className="bg-gray-900 rounded-lg p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-left py-2 font-semibold text-gray-300">Konto</th>
                  <th className="text-right py-2 font-semibold text-gray-300">
                    Ing. balans
                    <br />
                    {year}-01-01
                  </th>
                  <th className="text-right py-2 font-semibold text-gray-300">Resultat</th>
                  <th className="text-right py-2 font-semibold text-gray-300">
                    Utg. balans
                    <br />
                    {year}-12-31
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t-2 border-gray-500">
                  <td className="py-2 font-bold text-white">Summa {titel.toLowerCase()}</td>
                  <td className="py-2 text-right font-bold text-white">0 kr</td>
                  <td className="py-2 text-right font-bold text-white">0 kr</td>
                  <td className="py-2 text-right font-bold text-white">0 kr</td>
                </tr>
              </tbody>
            </table>
          </div>
        </AnimeradFlik>
      );
    }

    return (
      <AnimeradFlik title={titel} icon={icon} visaSummaDirekt={formatSEK(summa)} forcedOpen={true}>
        <div className="bg-gray-900 rounded-lg p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="text-left py-2 font-semibold text-gray-300">Konto</th>
                <th className="text-right py-2 font-semibold text-gray-300">
                  Ing. balans
                  <br />
                  {year}-01-01
                </th>
                <th className="text-right py-2 font-semibold text-gray-300">Resultat</th>
                <th className="text-right py-2 font-semibold text-gray-300">
                  Utg. balans
                  <br />
                  {year}-12-31
                </th>
              </tr>
            </thead>
            <tbody>
              {konton.map((konto) => (
                <tr key={konto.kontonummer} className="border-b border-gray-700">
                  <td className="py-2 text-white">
                    {konto.kontonummer} – {konto.beskrivning}
                  </td>
                  <td className="py-2 text-right text-white">{formatSEK(konto.ingaendeSaldo)}</td>
                  <td className="py-2 text-right text-white">{formatSEK(konto.aretsResultat)}</td>
                  <td className="py-2 text-right text-white font-medium">
                    {formatSEK(konto.utgaendeSaldo)}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-500">
                <td className="py-2 font-bold text-white">Summa {titel.toLowerCase()}</td>
                <td className="py-2 text-right font-bold text-white">
                  {formatSEK(konton.reduce((sum, k) => sum + k.ingaendeSaldo, 0))}
                </td>
                <td className="py-2 text-right font-bold text-white">
                  {formatSEK(konton.reduce((sum, k) => sum + k.aretsResultat, 0))}
                </td>
                <td className="py-2 text-right font-bold text-white">{formatSEK(summa)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </AnimeradFlik>
    );
  };

  // Snygg rendering för eget kapital med beräknat resultat
  const renderaEgetKapitalMedKolumner = (
    titel: string,
    icon: string,
    konton: Konto[],
    beraknatResultatSaldo: number
  ) => {
    const kontonSumma = konton.reduce((a, b) => a + b.utgaendeSaldo, 0);
    const totalSumma = kontonSumma + beraknatResultatSaldo;

    return (
      <AnimeradFlik
        title={titel}
        icon={icon}
        visaSummaDirekt={formatSEK(totalSumma)}
        forcedOpen={true}
      >
        <div className="bg-gray-900 rounded-lg p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="text-left py-2 font-semibold text-gray-300">Konto</th>
                <th className="text-right py-2 font-semibold text-gray-300">
                  Ing. balans
                  <br />
                  {year}-01-01
                </th>
                <th className="text-right py-2 font-semibold text-gray-300">Resultat</th>
                <th className="text-right py-2 font-semibold text-gray-300">
                  Utg. balans
                  <br />
                  {year}-12-31
                </th>
              </tr>
            </thead>
            <tbody>
              {konton.map((konto) => (
                <tr key={konto.kontonummer} className="border-b border-gray-700">
                  <td className="py-2 text-white">
                    {konto.kontonummer} – {konto.beskrivning}
                  </td>
                  <td className="py-2 text-right text-white">{formatSEK(konto.ingaendeSaldo)}</td>
                  <td className="py-2 text-right text-white">{formatSEK(konto.aretsResultat)}</td>
                  <td className="py-2 text-right text-white font-medium">
                    {formatSEK(konto.utgaendeSaldo)}
                  </td>
                </tr>
              ))}
              {beraknatResultatSaldo !== 0 && (
                <tr className="border-b border-gray-700">
                  <td className="py-2 text-white">Beräknat resultat</td>
                  <td className="py-2 text-right text-white">
                    {formatSEK(beraknatResultatData.ingaende)}
                  </td>
                  <td className="py-2 text-right text-white">
                    {formatSEK(beraknatResultatData.arets)}
                  </td>
                  <td className="py-2 text-right text-white font-medium">
                    {formatSEK(beraknatResultatData.utgaende)}
                  </td>
                </tr>
              )}
              <tr className="border-t-2 border-gray-500">
                <td className="py-2 font-bold text-white">Summa {titel.toLowerCase()}</td>
                <td className="py-2 text-right font-bold text-white">
                  {formatSEK(
                    konton.reduce((sum, k) => sum + k.ingaendeSaldo, 0) +
                      beraknatResultatData.ingaende
                  )}
                </td>
                <td className="py-2 text-right font-bold text-white">
                  {formatSEK(
                    konton.reduce((sum, k) => sum + k.aretsResultat, 0) + beraknatResultatData.arets
                  )}
                </td>
                <td className="py-2 text-right font-bold text-white">{formatSEK(totalSumma)}</td>
              </tr>
            </tbody>
          </table>
        </div>
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

        {/* TILLGÅNGAR - Elegant AnimeradFlik layout */}
        <AnimeradFlik
          title="Tillgångar"
          icon="💼"
          visaSummaDirekt={formatSEK(
            [...anläggningstillgångar, ...omsättningstillgångar].reduce(
              (sum, k) => sum + k.utgaendeSaldo,
              0
            )
          )}
          forcedOpen={true}
        >
          <div className="bg-gray-900 rounded-lg p-4">
            {anläggningstillgångar.length > 0 && (
              <div className="mb-4">
                <h4 className="text-white font-semibold mb-2">Anläggningstillgångar</h4>
                <table className="w-full text-sm mb-2">
                  <tbody>
                    {anläggningstillgångar.map((konto) => (
                      <tr key={konto.kontonummer} className="border-b border-gray-700">
                        <td className="py-2 text-white">
                          {konto.kontonummer} – {konto.beskrivning}
                        </td>
                        <td className="py-2 text-right text-white">
                          {formatSEK(konto.ingaendeSaldo)}
                        </td>
                        <td className="py-2 text-right text-white">
                          {formatSEK(konto.aretsResultat)}
                        </td>
                        <td className="py-2 text-right text-white font-medium">
                          {formatSEK(konto.utgaendeSaldo)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Omsättningstillgångar</h4>
              <table className="w-full text-sm mb-2">
                <tbody>
                  {omsättningstillgångar.map((konto) => (
                    <tr key={konto.kontonummer} className="border-b border-gray-700">
                      <td className="py-2 text-white">
                        {konto.kontonummer} – {konto.beskrivning}
                      </td>
                      <td className="py-2 text-right text-white">
                        {formatSEK(konto.ingaendeSaldo)}
                      </td>
                      <td className="py-2 text-right text-white">
                        {formatSEK(konto.aretsResultat)}
                      </td>
                      <td className="py-2 text-right text-white font-medium">
                        {formatSEK(konto.utgaendeSaldo)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-left py-2 font-semibold text-gray-300">Konto</th>
                  <th className="text-right py-2 font-semibold text-gray-300">
                    Ing. balans
                    <br />
                    {year}-01-01
                  </th>
                  <th className="text-right py-2 font-semibold text-gray-300">Resultat</th>
                  <th className="text-right py-2 font-semibold text-gray-300">
                    Utg. balans
                    <br />
                    {year}-12-31
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t-2 border-gray-500">
                  <td className="py-2 font-bold text-white">Summa tillgångar</td>
                  <td className="py-2 text-right font-bold text-white">
                    {formatSEK(
                      [...anläggningstillgångar, ...omsättningstillgångar].reduce(
                        (sum, k) => sum + k.ingaendeSaldo,
                        0
                      )
                    )}
                  </td>
                  <td className="py-2 text-right font-bold text-white">
                    {formatSEK(
                      [...anläggningstillgångar, ...omsättningstillgångar].reduce(
                        (sum, k) => sum + k.aretsResultat,
                        0
                      )
                    )}
                  </td>
                  <td className="py-2 text-right font-bold text-white">
                    {formatSEK(
                      [...anläggningstillgångar, ...omsättningstillgångar].reduce(
                        (sum, k) => sum + k.utgaendeSaldo,
                        0
                      )
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </AnimeradFlik>

        {/* EGET KAPITAL OCH SKULDER - Elegant AnimeradFlik layout */}
        <AnimeradFlik
          title="Eget kapital och skulder"
          icon="🏛️"
          visaSummaDirekt={formatSEK(
            [...egetKapital, ...långfristigaSkulder, ...kortfristigaSkulder].reduce(
              (sum, k) => sum + k.utgaendeSaldo,
              0
            ) + (beraknatResultatKonto ? beraknatResultatKonto.utgaendeSaldo : 0)
          )}
          forcedOpen={true}
        >
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Eget kapital</h4>
              <table className="w-full text-sm mb-2">
                <tbody>
                  {egetKapital.map((konto) => (
                    <tr key={konto.kontonummer} className="border-b border-gray-700">
                      <td className="py-2 text-white">
                        {konto.kontonummer} – {konto.beskrivning}
                      </td>
                      <td className="py-2 text-right text-white">
                        {formatSEK(konto.ingaendeSaldo)}
                      </td>
                      <td className="py-2 text-right text-white">
                        {formatSEK(konto.aretsResultat)}
                      </td>
                      <td className="py-2 text-right text-white font-medium">
                        {formatSEK(konto.utgaendeSaldo)}
                      </td>
                    </tr>
                  ))}
                  {beraknatResultatKonto && (
                    <tr className="border-b border-gray-700">
                      <td className="py-2 text-white">Beräknat resultat</td>
                      <td className="py-2 text-right text-white">
                        {formatSEK(beraknatResultatKonto.ingaendeSaldo)}
                      </td>
                      <td className="py-2 text-right text-white">
                        {formatSEK(beraknatResultatKonto.aretsResultat)}
                      </td>
                      <td className="py-2 text-right text-white font-medium">
                        {formatSEK(beraknatResultatKonto.utgaendeSaldo)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {långfristigaSkulder.length > 0 && (
              <div className="mb-4">
                <h4 className="text-white font-semibold mb-2">Långfristiga skulder</h4>
                <table className="w-full text-sm mb-2">
                  <tbody>
                    {långfristigaSkulder.map((konto) => (
                      <tr key={konto.kontonummer} className="border-b border-gray-700">
                        <td className="py-2 text-white">
                          {konto.kontonummer} – {konto.beskrivning}
                        </td>
                        <td className="py-2 text-right text-white">
                          {formatSEK(konto.ingaendeSaldo)}
                        </td>
                        <td className="py-2 text-right text-white">
                          {formatSEK(konto.aretsResultat)}
                        </td>
                        <td className="py-2 text-right text-white font-medium">
                          {formatSEK(konto.utgaendeSaldo)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Kortfristiga skulder</h4>
              <table className="w-full text-sm mb-2">
                <tbody>
                  {kortfristigaSkulder.map((konto) => (
                    <tr key={konto.kontonummer} className="border-b border-gray-700">
                      <td className="py-2 text-white">
                        {konto.kontonummer} – {konto.beskrivning}
                      </td>
                      <td className="py-2 text-right text-white">
                        {formatSEK(konto.ingaendeSaldo)}
                      </td>
                      <td className="py-2 text-right text-white">
                        {formatSEK(konto.aretsResultat)}
                      </td>
                      <td className="py-2 text-right text-white font-medium">
                        {formatSEK(konto.utgaendeSaldo)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-left py-2 font-semibold text-gray-300">Konto</th>
                  <th className="text-right py-2 font-semibold text-gray-300">
                    Ing. balans
                    <br />
                    {year}-01-01
                  </th>
                  <th className="text-right py-2 font-semibold text-gray-300">Resultat</th>
                  <th className="text-right py-2 font-semibold text-gray-300">
                    Utg. balans
                    <br />
                    {year}-12-31
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t-2 border-gray-500">
                  <td className="py-2 font-bold text-white">Summa eget kapital och skulder</td>
                  <td className="py-2 text-right font-bold text-white">
                    {formatSEK(
                      [...egetKapital, ...långfristigaSkulder, ...kortfristigaSkulder].reduce(
                        (sum, k) => sum + k.ingaendeSaldo,
                        0
                      ) + (beraknatResultatKonto ? beraknatResultatKonto.ingaendeSaldo : 0)
                    )}
                  </td>
                  <td className="py-2 text-right font-bold text-white">
                    {formatSEK(
                      [...egetKapital, ...långfristigaSkulder, ...kortfristigaSkulder].reduce(
                        (sum, k) => sum + k.aretsResultat,
                        0
                      ) + (beraknatResultatKonto ? beraknatResultatKonto.aretsResultat : 0)
                    )}
                  </td>
                  <td className="py-2 text-right font-bold text-white">
                    {formatSEK(
                      [...egetKapital, ...långfristigaSkulder, ...kortfristigaSkulder].reduce(
                        (sum, k) => sum + k.utgaendeSaldo,
                        0
                      ) + (beraknatResultatKonto ? beraknatResultatKonto.utgaendeSaldo : 0)
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </AnimeradFlik>
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
