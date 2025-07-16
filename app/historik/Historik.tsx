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
  const [historyData] = useState<HistoryItem[]>(
    [...initialData].sort((a, b) => b.transaktions_id - a.transaktions_id)
  );
  const [detailsMap, setDetailsMap] = useState<Record<number, TransactionDetail[]>>({});
  const [activeId, setActiveId] = useState<number | null>(null);

  // Filtrera data på valt år
  const filteredData = historyData.filter((item) => item.transaktionsdatum.slice(0, 4) === year);

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
    { key: "kontobeskrivning", label: "Konto" },
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
        <div className="flex justify-center">
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

          return (
            <tr className="bg-slate-800">
              <td colSpan={5} className="p-0">
                <div className="p-4">
                  <table className="w-full text-sm">
                    <thead className="border-b border-slate-600">
                      <tr>
                        <th className="text-left py-2 pl-6">Konto</th>
                        <th className="text-right py-2 pr-4">Debet</th>
                        <th className="text-right py-2 pr-6">Kredit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((detail) => (
                        <tr key={detail.transaktionspost_id} className="border-b border-slate-700">
                          <td className="py-2 pl-6 pr-4">
                            {detail.kontonummer} – {detail.beskrivning}
                          </td>
                          <td className="py-2 pr-4 text-right">
                            {detail.debet.toLocaleString("sv-SE", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }) + " kr"}
                          </td>
                          <td className="py-2 pr-6 text-right">
                            {detail.kredit.toLocaleString("sv-SE", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }) + " kr"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {item.blob_url && (
                    <div className="pt-4 border-slate-600 text-center">
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
