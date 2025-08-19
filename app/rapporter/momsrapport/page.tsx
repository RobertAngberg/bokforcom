"use client";

import React, { useState, useEffect } from "react";
import { getMomsrapport, fetchFöretagsprofil } from "./actions";
import Tabell, { ColumnDefinition } from "../../_components/Tabell";
import Dropdown from "../../_components/Dropdown";
import MainLayout from "../../_components/MainLayout";
import { auth } from "../../../auth";

type MomsRad = {
  fält: string;
  beskrivning: string;
  belopp: number;
};

export default function Page() {
  const [initialData, setInitialData] = useState<MomsRad[]>([]);
  const [organisationsnummer, setOrganisationsnummer] = useState("");
  const [företagsnamn, setFöretagsnamn] = useState("");
  const [år, setÅr] = useState("2025");
  const [kvartal, setKvartal] = useState("Hela året");
  const [activeId, setActiveId] = useState<string | number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string>("");

  useEffect(() => {
    const loadData = async () => {
      const data = await getMomsrapport("2025");
      setInitialData(data);

      // Försök hämta företagsprofil om möjligt
      try {
        // Note: Detta behöver anpassas för client-side
        const profil = null as { organisationsnummer?: string; företagsnamn?: string } | null; // await fetchFöretagsprofil();
        if (profil) {
          setOrganisationsnummer(profil.organisationsnummer ?? "");
          setFöretagsnamn(profil.företagsnamn ?? "");
        }
      } catch (error) {
        console.log("Kunde inte hämta företagsprofil");
      }
    };

    loadData();
  }, []);

  const årLista = ["2023", "2024", "2025"].map((år) => ({ label: år, value: år }));
  const kvartalLista = ["Hela året", "Q1", "Q2", "Q3", "Q4"].map((kv) => ({
    label: kv,
    value: kv,
  }));

  const get = (fält: string) => initialData.find((r) => r.fält === fält)?.belopp ?? 0;
  const sum = (...fält: string[]) => fält.reduce((acc, f) => acc + get(f), 0);

  const generateXML = () => {
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
      "22": "InkopVaruEg",
      "23": "InkopTjanstEg",
      "24": "InkopTjanstUtlandet",
      "30": "MomsInkopUtlandet",
      "31": "MomsInkopRevers",
      "35": "MomsTillbaka",
      "36": "MomsRedov",
      "37": "MomsKvar",
      "38": "MomsKompens",
      "39": "MomsTillbaka",
      "48": "FordrAvr",
      "49": "SkuldAvr",
    };

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<MomsdeklarationRequest xmlns="http://xmls.skatteverket.se/se/skatteverket/da/etjanster/momsdeklaration/6/2021">
  <Organisationsnummer>${organisationsnummer}</Organisationsnummer>
  <Period>
    <Year>${år}</Year>`;

    if (kvartal !== "Hela året") {
      xml += `<Quarter>${kvartal.replace("Q", "")}</Quarter>`;
    }

    xml += `
  </Period>
  <Momsdeklaration>`;

    initialData.forEach((rad) => {
      const xmlField = fieldMapping[rad.fält];
      if (xmlField && rad.belopp !== 0) {
        xml += `
    <${xmlField}>${Math.round(rad.belopp)}</${xmlField}>`;
      }
    });

    xml += `
  </Momsdeklaration>
</MomsdeklarationRequest>`;

    return xml;
  };

  const exportToXML = () => {
    try {
      setIsExporting(true);
      setExportMessage("");

      if (!organisationsnummer) {
        setExportMessage("⚠️ Organisationsnummer saknas. Kontrollera företagsprofilen.");
        setIsExporting(false);
        return;
      }

      const xml = generateXML();
      const blob = new Blob([xml], { type: "application/xml" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `momsdeklaration_${år}_${kvartal.replace(" ", "_")}.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportMessage("✅ XML-fil exporterad!");
    } catch (error) {
      console.error("Export error:", error);
      setExportMessage("❌ Fel vid export");
    } finally {
      setIsExporting(false);
    }
  };

  const kolumner: ColumnDefinition<MomsRad>[] = [
    { key: "fält", label: "Fält", render: (value: any) => String(value) },
    { key: "beskrivning", label: "Beskrivning" },
    {
      key: "belopp",
      label: "Belopp",
      render: (value: any) => {
        const num = Number(value);
        return num.toLocaleString("sv-SE", {
          style: "currency",
          currency: "SEK",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        });
      },
    },
  ];

  return (
    <MainLayout>
      <div className="p-6 bg-gray-900 min-h-screen text-white">
        <h1 className="text-3xl font-bold mb-6 text-center">Momsrapport</h1>

        <div className="flex flex-wrap gap-4 mb-6 justify-center">
          <Dropdown label="År" value={år} options={årLista} onChange={setÅr} />
          <Dropdown label="Period" value={kvartal} options={kvartalLista} onChange={setKvartal} />
        </div>

        <div className="mb-6 text-center">
          <button
            onClick={exportToXML}
            disabled={isExporting}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded disabled:opacity-50"
          >
            {isExporting ? "Exporterar..." : "Exportera XML för Skatteverket"}
          </button>
          {exportMessage && <p className="mt-2 text-sm">{exportMessage}</p>}
        </div>

        <Tabell
          data={initialData}
          columns={kolumner}
          getRowId={(rad) => rad.fält}
          handleRowClick={() => {}}
          activeId={activeId}
        />

        <div className="mt-6 p-4 bg-gray-800 rounded">
          <h3 className="text-lg font-semibold mb-2">Sammanfattning</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p>
                <strong>Moms att betala:</strong> {get("49").toLocaleString("sv-SE")} kr
              </p>
              <p>
                <strong>Moms att få tillbaka:</strong> {get("48").toLocaleString("sv-SE")} kr
              </p>
            </div>
            <div>
              <p>
                <strong>Försäljning totalt:</strong>{" "}
                {sum("05", "06", "07", "08").toLocaleString("sv-SE")} kr
              </p>
              <p>
                <strong>Inköp totalt:</strong>{" "}
                {sum("20", "21", "22", "23", "24").toLocaleString("sv-SE")} kr
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
