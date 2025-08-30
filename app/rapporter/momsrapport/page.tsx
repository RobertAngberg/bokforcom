"use client";

import React, { useState, useEffect } from "react";
import MainLayout from "../../_components/MainLayout";
import Tabell, { ColumnDefinition } from "../../_components/Tabell";
import Dropdown from "../../_components/Dropdown";
import Knapp from "../../_components/Knapp";
import { exportMomsrapportPDF, exportMomsrapportCSV } from "../../_utils/fileUtils";
import { getMomsrapport, fetchFöretagsprofil } from "./actions";

type MomsRad = {
  fält: string;
  beskrivning: string;
  belopp: number;
};

export default function Page() {
  //#region State
  const [initialData, setInitialData] = useState<MomsRad[]>([]);
  const [organisationsnummer, setOrganisationsnummer] = useState<string>("");
  const [företagsnamn, setFöretagsnamn] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [år, setÅr] = useState("2025");
  const [activeId, setActiveId] = useState<string | number | null>(null);
  //#endregion

  //#region Constants
  const årLista = ["2023", "2024", "2025"];
  //#endregion

  // Ladda data när komponenten mountas
  useEffect(() => {
    const loadData = async () => {
      try {
        const [momsData, profilData] = await Promise.all([
          getMomsrapport("2025"),
          fetchFöretagsprofil(),
        ]);

        setInitialData(momsData || []);
        setOrganisationsnummer(profilData?.organisationsnummer ?? "");
        setFöretagsnamn(profilData?.företagsnamn ?? "");
      } catch (error) {
        console.error("Fel vid laddning av momsdata:", error);
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
          <div className="text-white">Laddar momsrapport...</div>
        </div>
      </MainLayout>
    );
  }

  //#region Helper Functions
  const get = (fält: string) => initialData.find((r) => r.fält === fält)?.belopp ?? 0;
  const sum = (...fält: string[]) => fält.reduce((acc, f) => acc + get(f), 0);

  const generateXML = () => {
    // Mapping från fält till XML-taggar enligt Skatteverkets specifikation
    const fieldMapping: { [key: string]: string } = {
      "05": "ForsMomsEjAnnan",
      "06": "UttagMoms",
      "07": "UlagMargbesk",
      "08": "HyrinkomstFriv",
      "10": "MomsUtgHog",
      "11": "MomsUtgMedel",
      "12": "MomsUtgLag",
      "20": "InkopVaruAnnatEg",
      "21": "InkopTjanstAnnatEg",
      "22": "InkopTjanstUtomEg",
      "23": "InkopVaruSverige",
      "24": "InkopTjanstSverige",
      "30": "MomsInkopUtgHog",
      "31": "MomsInkopUtgMedel",
      "32": "MomsInkopUtgLag",
      "35": "ForsVaruAnnatEg",
      "36": "ForsVaruUtomEg",
      "37": "InkopVaruMellan3p",
      "38": "ForsVaruMellan3p",
      "39": "ForsTjSkskAnnatEg",
      "40": "ForsTjOvrUtomEg",
      "41": "ForsKopareSkskSverige",
      "42": "ForsOvrigt",
      "48": "MomsIngAvdr",
      "49": "MomsBetala",
      "50": "MomsUlagImport",
      "60": "MomsImportUtgHog",
      "61": "MomsImportUtgMedel",
      "62": "MomsImportUtgLag",
    };

    // Formatera period för hela året
    const period = `${år}12`; // Hela året = sista månaden

    // Bygg XML-struktur med Bokio's format
    let xml = '<?xml version="1.0" encoding="utf-8"?>\n';
    xml +=
      '<!DOCTYPE eSKDUpload PUBLIC "-//Skatteverket, Sweden//DTD Skatteverket eSKDUpload-DTD Version 6.0//SV" "https://www.skatteverket.se/download/18.3f4496fd14864cc5ac99cb1/1415022101213/eSKDUpload_6p0.dtd">\n';
    xml += '<eSKDUpload Version="6.0">\n';
    xml += `  <OrgNr>${organisationsnummer || "XXXXXX-XXXX"}</OrgNr>\n`;
    xml += "  <Moms>\n";
    xml += `    <Period>${period}</Period>\n`;

    // Lägg till alla fält som har värden != 0 med proper indentation
    Object.entries(fieldMapping).forEach(([fältNr, xmlTag]) => {
      const värde = get(fältNr);
      if (värde !== 0) {
        // Formatera som heltal enligt Skatteverkets krav
        const belopp = Math.round(värde);
        xml += `    <${xmlTag}>${belopp}</${xmlTag}>\n`;
      }
    });

    xml += "  </Moms>\n";
    xml += "</eSKDUpload>";

    return xml;
  };

  const exportXML = () => {
    const xmlContent = generateXML();
    const blob = new Blob([xmlContent], { type: "application/xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `momsdeklaration_${år}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    try {
      await exportMomsrapportPDF(initialData, företagsnamn, organisationsnummer, år);
    } catch (error) {
      console.error("PDF export failed:", error);
    }
  };

  const exportCSV = async () => {
    try {
      await exportMomsrapportCSV(initialData, företagsnamn, organisationsnummer, år);
    } catch (error) {
      console.error("CSV export failed:", error);
    }
  };
  //#endregion

  //#region Calculations
  const ruta49 = get("49");
  const utgåendeMoms = sum("10", "11", "12", "30", "31", "32", "60", "61", "62");
  const ingåendeMoms = get("48");
  const momsAttBetalaEllerFaTillbaka = utgåendeMoms - ingåendeMoms;
  const diff = Math.abs(momsAttBetalaEllerFaTillbaka - ruta49);
  const ärKorrekt = diff < 1;
  //#endregion

  //#region Data Configuration
  const fullData: MomsRad[] = [
    { fält: "05", beskrivning: "Momspliktig försäljning", belopp: get("05") },
    { fält: "06", beskrivning: "Momspliktiga uttag", belopp: get("06") },
    { fält: "07", beskrivning: "Vinstmarginalbeskattning", belopp: get("07") },
    { fält: "08", beskrivning: "Hyresinkomster med frivillig moms", belopp: get("08") },
    { fält: "10", beskrivning: "Utgående moms 25%", belopp: get("10") },
    { fält: "11", beskrivning: "Utgående moms 12%", belopp: get("11") },
    { fält: "12", beskrivning: "Utgående moms 6%", belopp: get("12") },
    { fält: "20", beskrivning: "Inköp varor från annat EU-land", belopp: get("20") },
    { fält: "21", beskrivning: "Inköp tjänster från EU-land", belopp: get("21") },
    { fält: "22", beskrivning: "Inköp tjänster från utanför EU", belopp: get("22") },
    { fält: "23", beskrivning: "Inköp varor i Sverige (omv moms)", belopp: get("23") },
    { fält: "24", beskrivning: "Inköp tjänster i Sverige (omv moms)", belopp: get("24") },
    { fält: "30", beskrivning: "Utgående moms 25% (omv moms)", belopp: get("30") },
    { fält: "31", beskrivning: "Utgående moms 12% (omv moms)", belopp: get("31") },
    { fält: "32", beskrivning: "Utgående moms 6% (omv moms)", belopp: get("32") },
    { fält: "50", beskrivning: "Beskattningsunderlag import", belopp: get("50") },
    { fält: "60", beskrivning: "Utgående moms 25% (import)", belopp: get("60") },
    { fält: "61", beskrivning: "Utgående moms 12% (import)", belopp: get("61") },
    { fält: "62", beskrivning: "Utgående moms 6% (import)", belopp: get("62") },
    { fält: "35", beskrivning: "Varuförsäljning till EU-land", belopp: get("35") },
    { fält: "36", beskrivning: "Export varor utanför EU", belopp: get("36") },
    { fält: "37", beskrivning: "3-partshandel inköp", belopp: get("37") },
    { fält: "38", beskrivning: "3-partshandel försäljning", belopp: get("38") },
    { fält: "39", beskrivning: "Tjänst till EU (huvudregel)", belopp: get("39") },
    { fält: "40", beskrivning: "Tjänst till utanför EU", belopp: get("40") },
    { fält: "41", beskrivning: "Försäljning med omv moms", belopp: get("41") },
    { fält: "42", beskrivning: "Övrigt momsundantaget", belopp: get("42") },
    { fält: "48", beskrivning: "Ingående moms att dra av", belopp: get("48") },
    { fält: "49", beskrivning: "Moms att betala eller få tillbaka", belopp: ruta49 },
  ];

  const columns: ColumnDefinition<MomsRad>[] = [
    { key: "fält", label: "Fält" },
    { key: "beskrivning", label: "Beskrivning" },
    {
      key: "belopp",
      label: "Belopp",
      render: (_val, row) => {
        const ärRuta49 = row.fält === "49";
        const klass = ärRuta49
          ? !ärKorrekt
            ? "text-orange-500 font-bold"
            : momsAttBetalaEllerFaTillbaka > 0
              ? "text-orange-500 font-bold"
              : "text-green-600 font-bold"
          : "";

        const beloppAbsolut = Math.abs(row.belopp);

        return row.belopp === 0 ? (
          <span className="text-gray-400">–</span>
        ) : (
          <div className={klass}>
            <span>{beloppAbsolut.toLocaleString("sv-SE", { minimumFractionDigits: 2 })} kr</span>
            {ärRuta49 && (
              <div className="text-sm text-gray-400 mt-1">
                {row.belopp < 0 ? "Du får tillbaka moms" : "Du ska betala moms"}
              </div>
            )}
          </div>
        );
      },
    },
  ];

  const spawnaBlock = (titel: string, fält: string[]) => (
    <div className="min-w-[49%] px-2">
      <h2 className="font-bold mb-2 text-white">{titel}</h2>
      <Tabell
        data={fullData.filter((rad) => fält.includes(rad.fält))}
        columns={columns}
        getRowId={(rad) => rad.fält}
        activeId={activeId}
        handleRowClick={(id) => setActiveId(id)}
      />
    </div>
  );
  //#endregion

  return (
    <MainLayout>
      <div className="px-4">
        {!ärKorrekt && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded">
            ⚠️ Momsrapporten stämmer inte! <br />
            Beräknat belopp:{" "}
            {momsAttBetalaEllerFaTillbaka.toLocaleString("sv-SE", { minimumFractionDigits: 2 })} kr
            <br />
            Ruta 49 innehåller: {ruta49.toLocaleString("sv-SE", { minimumFractionDigits: 2 })} kr
          </div>
        )}

        <h1 className="text-2xl font-bold text-center mb-8">Momsrapport för {år}</h1>

        <div className="flex justify-between items-center mb-8">
          <Dropdown
            value={år}
            onChange={setÅr}
            placeholder="Välj år"
            options={årLista.map((y) => ({ label: y, value: y }))}
            className="w-32"
          />

          <div className="flex gap-3">
            <Knapp text="📄 Exportera PDF" onClick={exportPDF} />
            <Knapp text="📊 Exportera CSV" onClick={exportCSV} />
            <Knapp text="Exportera XML" onClick={exportXML} />
          </div>
        </div>

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
          <div className="w-full md:w-1/2 px-2 flex flex-col gap-6">
            {spawnaBlock("F. Ingående moms", ["48"])}
            {spawnaBlock("G. Moms att betala eller få tillbaka", ["49"])}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
