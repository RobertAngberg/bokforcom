// #region
"use client";

import React, { useState } from "react";
import Tabell from "../_components/Tabell";
import { ColumnDefinition } from "../_components/TabellRad";
import MainLayout from "../_components/MainLayout";
import { fetchTransactionDetails, exporteraTransaktionerMedPoster } from "./actions";
import Dropdown from "../_components/Dropdown";
import Knapp from "../_components/Knapp";

export interface HistoryItem {
  transaktions_id: number;
  transaktionsdatum: string;
  kontobeskrivning: string;
  belopp: number;
  kommentar?: string;
  fil?: string;
  blob_url?: string;
}

export interface TransactionDetail {
  transaktionspost_id: number;
  kontonummer: string;
  beskrivning: string;
  debet: number;
  kredit: number;
}

type Props = {
  initialData: HistoryItem[];
};
// #endregion

export default function Historik({ initialData }: Props) {
  const [year, setYear] = useState("2025");
  const [month, setMonth] = useState(""); // Tom sträng = alla månader
  const [searchTerm, setSearchTerm] = useState(""); // Nytt sökfält
  const [historyData] = useState<HistoryItem[]>(
    [...initialData].sort((a, b) => {
      // Sortera efter datum DESC, sedan ID DESC
      const dateCompare =
        new Date(b.transaktionsdatum).getTime() - new Date(a.transaktionsdatum).getTime();
      if (dateCompare !== 0) return dateCompare;
      return b.transaktions_id - a.transaktions_id;
    })
  );
  const [detailsMap, setDetailsMap] = useState<Record<number, TransactionDetail[]>>({});
  const [activeId, setActiveId] = useState<number | null>(null);

  // Filtrera data på valt år, månad och sökterm
  const filteredData = historyData.filter((item) => {
    const itemYear = item.transaktionsdatum.slice(0, 4);
    const itemMonth = item.transaktionsdatum.slice(5, 7);

    // År och månad filter
    if (itemYear !== year) return false;
    if (month && itemMonth !== month) return false;

    // Sökterm filter (sök i verifikat och kommentar)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesVerifikat = item.kontobeskrivning.toLowerCase().includes(searchLower);
      const matchesComment = item.kommentar?.toLowerCase().includes(searchLower);
      const matchesId = item.transaktions_id.toString().includes(searchTerm);

      if (!matchesVerifikat && !matchesComment && !matchesId) return false;
    }

    return true;
  });
  const handleRowClick = (id: string | number) => {
    const numericId = typeof id === "string" ? parseInt(id) : id;

    void (async () => {
      if (numericId === activeId) {
        setActiveId(null);
      } else {
        setActiveId(numericId);
        if (!detailsMap[numericId]) {
          const detailResult = await fetchTransactionDetails(numericId);
          setDetailsMap((prev) => ({ ...prev, [numericId]: detailResult }));
        }
      }
    })();
  };

  const handleExport = async () => {
    const exportData = await exporteraTransaktionerMedPoster(year);

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `transaktioner_${year}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const columns: ColumnDefinition<HistoryItem>[] = [
    { key: "transaktions_id", label: "ID" },
    { key: "transaktionsdatum", label: "Datum" },
    { key: "kontobeskrivning", label: "Verifikat" },
    {
      key: "belopp",
      label: "Belopp",
      render: (_: number, item: HistoryItem) => {
        // Summera debet från detailsMap om finns, annars visa originalvärde
        const details = detailsMap[item.transaktions_id];
        let debetSum = item.belopp;
        if (details && details.length > 0) {
          debetSum = details.reduce((sum, d) => sum + (d.debet || 0), 0);
        }
        return debetSum.toLocaleString("sv-SE", {
          style: "currency",
          currency: "SEK",
        });
      },
    },
    { key: "kommentar", label: "Kommentar", hiddenOnMobile: true },
  ];

  return (
    <MainLayout>
      <div className="text-center mb-8 space-y-4">
        <h1 className="text-3xl">Historik</h1>
        <div className="flex justify-center gap-4 flex-wrap">
          <div className="max-w-[8rem] w-full">
            <Dropdown
              value={year}
              onChange={setYear}
              placeholder="Välj år"
              options={[
                { label: "2025", value: "2025" },
                { label: "2024", value: "2024" },
                { label: "2023", value: "2023" },
                { label: "2022", value: "2022" },
                { label: "2021", value: "2021" },
                { label: "2020", value: "2020" },
              ]}
            />
          </div>
          <div className="max-w-[10rem] w-full">
            <Dropdown
              value={month}
              onChange={setMonth}
              placeholder="Månad"
              options={[
                { label: "Januari", value: "01" },
                { label: "Februari", value: "02" },
                { label: "Mars", value: "03" },
                { label: "April", value: "04" },
                { label: "Maj", value: "05" },
                { label: "Juni", value: "06" },
                { label: "Juli", value: "07" },
                { label: "Augusti", value: "08" },
                { label: "September", value: "09" },
                { label: "Oktober", value: "10" },
                { label: "November", value: "11" },
                { label: "December", value: "12" },
              ]}
            />
          </div>
          <div className="max-w-[12rem] w-full">
            <input
              type="text"
              placeholder="🔍 Sök..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 transition-all duration-200"
            />
          </div>
          <div className="border border-slate-500 rounded-lg px-3 py-2 bg-gray-800 h-[44px]">
            <div className="flex items-center text-slate-400 text-sm gap-2 h-full">
              <span>📄</span>
              <span>{filteredData.length} transaktioner</span>
            </div>
          </div>
        </div>

        <div className="pt-2"></div>
      </div>

      <Tabell
        data={filteredData}
        columns={columns}
        getRowId={(item: HistoryItem) => item.transaktions_id}
        activeId={activeId}
        handleRowClick={handleRowClick}
        renderExpandedRow={(item: HistoryItem) => {
          const rows = detailsMap[item.transaktions_id] ?? [];
          if (rows.length === 0) return null;

          // Kolumndefinitioner för expanderad tabell
          const detailColumns: ColumnDefinition<TransactionDetail>[] = [
            {
              key: "kontonummer",
              label: "Konto",
              render: (_, detail) => (
                <>
                  <span className="text-sm">{detail.kontonummer}</span> – {detail.beskrivning}
                </>
              ),
            },
            {
              key: "debet",
              label: "Debet",
              render: (value) =>
                value > 0
                  ? value.toLocaleString("sv-SE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }) + " kr"
                  : "—",
              className: "text-right",
            },
            {
              key: "kredit",
              label: "Kredit",
              render: (value) =>
                value > 0
                  ? value.toLocaleString("sv-SE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }) + " kr"
                  : "—",
              className: "text-right",
            },
          ];

          return (
            <tr className="bg-gray-800">
              <td colSpan={5} className="p-0">
                <div className="p-4">
                  <h4 className="text-sm font-semibold mb-3 text-gray-300">
                    📋 {item.kontobeskrivning.replace("Verifikation ", "")}
                  </h4>

                  <Tabell
                    data={rows}
                    columns={detailColumns}
                    getRowId={(detail) => detail.transaktionspost_id}
                  />

                  {item.blob_url && (
                    <div className="pt-4 text-center">
                      <Knapp
                        text="👁️ Se verifikat"
                        onClick={() => window.open(item.blob_url, "_blank")}
                      />
                    </div>
                  )}
                </div>
              </td>
            </tr>
          );
        }}
      />
    </MainLayout>
  );
}
